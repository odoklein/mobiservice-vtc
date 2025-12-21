import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyEstimateAccess } from '@/lib/auth/estimate-auth';
import { getAllSettings } from '@/lib/settings/company-settings';
import { InvoicePDF } from '@/lib/pdf/react-pdf-generator';
import { renderToBuffer } from '@react-pdf/renderer';
import { uploadPDF, generateDevisFilename } from '@/lib/storage/blob-storage';

/**
 * GET /api/estimate/[bookingId]
 * Génère et retourne un PDF de devis pour une réservation
 * 
 * Authentification supportée:
 * - Admin: via JWT token dans les cookies
 * - Client: via query params ?email=X&otp=Y ou ?phone=X&token=Y
 * 
 * Le PDF est généré avec Puppeteer, uploadé sur Vercel Blob, et streamé au client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId: bookingIdStr } = await params;
    const bookingId = parseInt(bookingIdStr);

    // Validation du bookingId
    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de réservation invalide' 
        },
        { status: 400 }
      );
    }

    console.log(`[Estimate API] Requête de devis pour booking ${bookingId}`);

    // 1. Vérifier l'accès (admin ou client)
    const accessCheck = await verifyEstimateAccess(request, bookingId);
    
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Non autorisé',
          message: accessCheck.reason || 'Vous n\'avez pas accès à ce devis',
        },
        { status: 401 }
      );
    }

    console.log(`[Estimate API] Accès vérifié: ${accessCheck.role}`);

    // 2. Récupérer la réservation
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    // 3. Vérifier si un PDF existe déjà dans le cache
    let pdfUrl = booking.documentsPdfPath;
    let shouldGenerateNew = true;

    if (pdfUrl && pdfUrl.includes('devis-')) {
      // On a déjà un PDF, vérifier s'il faut le regénérer
      const regenerate = request.nextUrl.searchParams.get('regenerate');
      if (!regenerate) {
        shouldGenerateNew = false;
        console.log(`[Estimate API] PDF existant trouvé: ${pdfUrl}`);
      }
    }

    let pdfBuffer: Buffer;

    if (shouldGenerateNew) {
      console.log('[Estimate API] Génération d\'un nouveau PDF...');

      // 4. Récupérer les settings de l'entreprise
      const { company, invoice } = await getAllSettings();

      // 5. Générer le PDF du devis avec @react-pdf/renderer
      console.log('[Estimate API] Génération du PDF...');
      pdfBuffer = await renderToBuffer(
        <InvoicePDF 
          type="devis"
          booking={booking}
          company={company}
          invoice={invoice}
        />
      );

      console.log(`[Estimate API] PDF généré (${pdfBuffer.length} bytes)`);

      // 7. Upload vers Vercel Blob Storage
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const filename = generateDevisFilename(bookingId);
          console.log(`[Estimate API] Upload vers Blob Storage: ${filename}`);
          
          pdfUrl = await uploadPDF(pdfBuffer, filename);
          
          // 8. Mettre à jour la base de données avec l'URL du PDF
          await db
            .update(bookings)
            .set({ 
              documentsPdfPath: pdfUrl,
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

          console.log(`[Estimate API] PDF sauvegardé: ${pdfUrl}`);
        } catch (uploadError) {
          console.error('[Estimate API] Erreur lors de l\'upload Blob:', uploadError);
          // Continue sans sauvegarder - on va quand même retourner le PDF
        }
      } else {
        console.warn('[Estimate API] BLOB_READ_WRITE_TOKEN non configuré, PDF non sauvegardé');
      }
    } else {
      // Utiliser le PDF existant - on redirige vers l'URL Blob
      if (pdfUrl) {
        return NextResponse.redirect(pdfUrl);
      }
      
      // Fallback: générer quand même
      console.log('[Estimate API] PDF cache invalide, génération forcée...');
      const { company, invoice } = await getAllSettings();
      pdfBuffer = await renderToBuffer(
        <InvoicePDF 
          type="devis"
          booking={booking}
          company={company}
          invoice={invoice}
        />
      );
    }

    // 9. Streamer le PDF au client
    const filename = `devis-${bookingId}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      },
    });

  } catch (error) {
    console.error('[Estimate API] Erreur lors de la génération du devis:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération du devis',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler pour CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

