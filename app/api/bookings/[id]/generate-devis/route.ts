import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateDevis, savePDF } from '@/lib/pdf/generator';

/**
 * POST /api/bookings/[id]/generate-devis
 * Génère un devis PDF pour une réservation (accessible par le client)
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

        // Générer le devis
        const htmlContent = await generateDevis(booking);
        const filename = `devis-${bookingId}`;
        const pdfPath = await savePDF(htmlContent, filename);

        return NextResponse.json({
            success: true,
            url: pdfPath,
            message: 'Devis généré avec succès',
        });
    } catch (error) {
        console.error('Error generating devis:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur lors de la génération du devis',
                message: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        );
    }
}

