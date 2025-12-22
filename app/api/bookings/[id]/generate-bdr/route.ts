import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateBonDeReservation, savePDF } from '@/lib/pdf/generator';

/**
 * POST /api/bookings/[id]/generate-bdr
 * Génère un Bon de Réservation PDF (accessible par le client après confirmation)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id);

        if (isNaN(bookingId)) {
            return NextResponse.json(
                { success: false, error: 'ID de réservation invalide' },
                { status: 400 }
            );
        }

        // Récupérer la réservation
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

        // Générer le BDR
        const htmlContent = await generateBonDeReservation(booking);
        const filename = `bdr-${bookingId}`;
        const pdfPath = await savePDF(htmlContent, filename);

        // Mettre à jour le booking avec le chemin du PDF
        await db
            .update(bookings)
            .set({
                documentsPdfPath: pdfPath,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        return NextResponse.json({
            success: true,
            url: pdfPath,
            message: 'Bon de réservation généré avec succès',
        });
    } catch (error) {
        console.error('Error generating BDR:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur lors de la génération du bon de réservation',
                message: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        );
    }
}





