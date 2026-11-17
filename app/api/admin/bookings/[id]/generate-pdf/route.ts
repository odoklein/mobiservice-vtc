import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { uploadPDF } from '@/lib/storage/blob-storage';
import { PDF_TYPES, adminPdfPath, isPdfType, renderBookingPdf } from '@/lib/pdf/render-booking-pdf';

/**
 * POST /api/admin/bookings/[id]/generate-pdf?type=facture|devis|bon|bdr
 *
 * Génère le document et renvoie l'URL où l'ouvrir. Le PDF est servi par l'application
 * (/api/admin/bookings/[id]/pdf), donc il ne dépend plus du stockage Vercel Blob :
 * si BLOB_READ_WRITE_TOKEN est configuré, une copie y est envoyée en plus, et un échec
 * de cet envoi ne bloque plus la génération.
 */
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
        const type = request.nextUrl.searchParams.get('type');

        if (isNaN(bookingId)) {
            return NextResponse.json({ message: 'ID de réservation invalide' }, { status: 400 });
        }
        if (!isPdfType(type)) {
            return NextResponse.json({ message: 'Type invalide (bon, facture, devis ou bdr)' }, { status: 400 });
        }

        // Génère le PDF (vérifie aussi que le document se construit sans erreur)
        const pdf = await renderBookingPdf(bookingId, type);
        if (!pdf) {
            return NextResponse.json({ message: 'Réservation introuvable' }, { status: 404 });
        }
        console.log(`[Generate PDF] ${type} #${bookingId}: ${pdf.buffer.length} bytes`);

        let url = adminPdfPath(bookingId, type);
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                url = await uploadPDF(pdf.buffer, `${PDF_TYPES[type].prefix}-${bookingId}-${Date.now()}.pdf`);
            } catch (uploadError) {
                console.warn('[Generate PDF] Blob upload failed, serving the PDF from the app instead:', uploadError);
            }
        }

        await db
            .update(bookings)
            .set({ [PDF_TYPES[type].dbField]: url, lastPdfGeneratedAt: new Date(), updatedAt: new Date() } as any)
            .where(eq(bookings.id, bookingId));

        return NextResponse.json({
            success: true,
            url,
            filename: pdf.filename,
            type,
            bookingId,
            message: `${PDF_TYPES[type].label} généré avec succès`,
            actions: {
                download: `${adminPdfPath(bookingId, type)}&download=1`,
                sendToClient: `/api/admin/bookings/${bookingId}/send-document?type=${type}&recipient=client`,
                sendToDriver: `/api/admin/bookings/${bookingId}/send-document?type=${type}&recipient=driver`,
            },
        });
    } catch (error) {
        console.error('[Generate PDF] Erreur:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Erreur lors de la génération du PDF',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        );
    }
}
