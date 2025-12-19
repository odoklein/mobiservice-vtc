import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { generateBonDeCommande, generateFacture, generateDevis, generateBonDeReservation, savePDF } from '@/lib/pdf/generator';

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

        let htmlContent: string;
        let filename: string;

        if (type === 'bon') {
            htmlContent = await generateBonDeCommande(booking);
            filename = `bon-commande-${bookingId}`;
        } else if (type === 'facture') {
            htmlContent = await generateFacture(booking);
            filename = `facture-${bookingId}`;
        } else if (type === 'devis') {
            htmlContent = await generateDevis(booking);
            filename = `devis-${bookingId}`;
        } else if (type === 'bdr') {
            htmlContent = await generateBonDeReservation(booking);
            filename = `bdr-${bookingId}`;
        } else {
            return NextResponse.json(
                { message: 'Type invalide (bon, facture, devis ou bdr)' },
                { status: 400 }
            );
        }

        const pdfPath = await savePDF(htmlContent, filename);

        // Update booking with PDF path
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
            message: 'Document généré avec succès',
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
            { message: 'Erreur lors de la génération du PDF' },
            { status: 500 }
        );
    }
}
