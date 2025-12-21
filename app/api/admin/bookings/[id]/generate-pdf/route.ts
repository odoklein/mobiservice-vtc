import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { getAllSettings } from '@/lib/settings/company-settings';
import { uploadPDF, generateFactureFilename, generateDevisFilename } from '@/lib/storage/blob-storage';
import { InvoicePDF } from '@/lib/pdf/react-pdf-generator';
import { renderToBuffer } from '@react-pdf/renderer';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const bookingId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'bon', 'facture', 'devis', or 'bdr'

        console.log(`[Generate PDF] Type: ${type}, Booking: ${bookingId}`);

        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        // Load company and invoice settings
        const { company, invoice } = await getAllSettings();

        let filename: string;
        let pdfType: 'facture' | 'devis' | 'bon' | 'bdr';

        // Déterminer le type et le nom de fichier
        if (type === 'bon') {
            pdfType = 'bon';
            filename = `bon-commande-${bookingId}.pdf`;
        } else if (type === 'facture') {
            pdfType = 'facture';
            filename = `facture-${bookingId}.pdf`;
        } else if (type === 'devis') {
            pdfType = 'devis';
            filename = `devis-${bookingId}.pdf`;
        } else if (type === 'bdr') {
            pdfType = 'bdr';
            filename = `bdr-${bookingId}.pdf`;
        } else {
            return NextResponse.json(
                { message: 'Type invalide (bon, facture, devis ou bdr)' },
                { status: 400 }
            );
        }

        console.log(`[Generate PDF] Génération du PDF avec @react-pdf/renderer...`);

        // Générer le PDF avec @react-pdf/renderer
        const pdfBuffer = await renderToBuffer(
            <InvoicePDF 
                type={pdfType}
                booking={booking}
                company={company}
                invoice={invoice}
            />
        );

        console.log(`[Generate PDF] PDF généré (${pdfBuffer.length} bytes)`);

        // Upload vers Vercel Blob Storage (optionnel)
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const blobFilename = type === 'facture' 
                    ? generateFactureFilename(bookingId)
                    : type === 'devis'
                    ? generateDevisFilename(bookingId)
                    : `${type}-${bookingId}-${Date.now()}.pdf`;

                const blobUrl = await uploadPDF(pdfBuffer, blobFilename);
                
                // Mettre à jour la DB avec l'URL du PDF
                await db
                    .update(bookings)
                    .set({
                        documentsPdfPath: blobUrl,
                        updatedAt: new Date(),
                    })
                    .where(eq(bookings.id, bookingId));

                console.log(`[Generate PDF] PDF uploadé: ${blobUrl}`);
            } catch (uploadError) {
                console.error('[Generate PDF] Erreur upload Blob:', uploadError);
                // Continue quand même pour retourner le PDF
            }
        }

        // Streamer le PDF au navigateur
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('[Generate PDF] Erreur:', error);
        return NextResponse.json(
            { 
                message: 'Erreur lors de la génération du PDF',
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}
