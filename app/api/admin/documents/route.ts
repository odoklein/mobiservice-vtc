import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { desc, or, isNotNull } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'facture', 'devis', or 'all'

        // Construire la condition WHERE selon le type
        let whereCondition;
        if (type === 'facture') {
            whereCondition = isNotNull(bookings.facturePdfUrl);
        } else if (type === 'devis') {
            whereCondition = isNotNull(bookings.devisPdfUrl);
        } else {
            // 'all' - tous les documents générés
            whereCondition = or(
                isNotNull(bookings.facturePdfUrl),
                isNotNull(bookings.devisPdfUrl),
                isNotNull(bookings.bonCommandePdfUrl),
                isNotNull(bookings.bonReservationPdfUrl)
            );
        }

        // Récupérer les bookings avec documents
        const bookingsWithDocs = await db
            .select()
            .from(bookings)
            .where(whereCondition)
            .orderBy(desc(bookings.lastPdfGeneratedAt), desc(bookings.updatedAt))
            .limit(100);

        // Transformer les données pour inclure les infos des documents
        const documents = bookingsWithDocs.map(booking => ({
            bookingId: booking.id,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
            pickupDate: booking.pickupDate,
            pickupTime: booking.pickupTime,
            pickupAddress: booking.pickupAddress,
            dropoffAddress: booking.dropoffAddress,
            totalPrice: booking.totalPriceTTC || booking.totalPrice,
            status: booking.status,
            lastGenerated: booking.lastPdfGeneratedAt,
            documents: {
                devis: booking.devisPdfUrl ? {
                    url: booking.devisPdfUrl,
                    type: 'devis',
                    name: 'Devis',
                } : null,
                facture: booking.facturePdfUrl ? {
                    url: booking.facturePdfUrl,
                    type: 'facture',
                    name: 'Facture',
                } : null,
                bonCommande: booking.bonCommandePdfUrl ? {
                    url: booking.bonCommandePdfUrl,
                    type: 'bon',
                    name: 'Bon de commande',
                } : null,
                bonReservation: booking.bonReservationPdfUrl ? {
                    url: booking.bonReservationPdfUrl,
                    type: 'bdr',
                    name: 'Bon de réservation',
                } : null,
            },
        }));

        return NextResponse.json({
            success: true,
            count: documents.length,
            documents,
        });

    } catch (error) {
        console.error('[List Documents] Erreur:', error);
        return NextResponse.json(
            { 
                success: false,
                message: 'Erreur lors de la récupération des documents',
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}


