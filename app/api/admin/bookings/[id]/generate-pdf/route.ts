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
        let dbField: 'facturePdfUrl' | 'devisPdfUrl' | 'bonCommandePdfUrl' | 'bonReservationPdfUrl';

        // Déterminer le type et le nom de fichier
        if (type === 'bon') {
            pdfType = 'bon';
            filename = `bon-commande-${bookingId}-${Date.now()}.pdf`;
            dbField = 'bonCommandePdfUrl';
        } else if (type === 'facture') {
            pdfType = 'facture';
            filename = generateFactureFilename(bookingId);
            dbField = 'facturePdfUrl';
        } else if (type === 'devis') {
            pdfType = 'devis';
            filename = generateDevisFilename(bookingId);
            dbField = 'devisPdfUrl';
        } else if (type === 'bdr') {
            pdfType = 'bdr';
            filename = `bdr-${bookingId}-${Date.now()}.pdf`;
            dbField = 'bonReservationPdfUrl';
        } else {
            return NextResponse.json(
                { message: 'Type invalide (bon, facture, devis ou bdr)' },
                { status: 400 }
            );
        }

        console.log(`[Generate PDF] Génération du PDF avec @react-pdf/renderer...`);

        // Générer le PDF avec @react-pdf/renderer
        const pdfBuffer = await renderToBuffer(
            React.createElement(InvoicePDF, {
                type: pdfType,
                booking: booking,
                company: company,
                invoice: invoice
            })
        );

        console.log(`[Generate PDF] PDF généré (${pdfBuffer.length} bytes)`);

        let pdfUrl = '';

        // Upload vers Vercel Blob Storage
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                pdfUrl = await uploadPDF(pdfBuffer, filename);
                
                // Mettre à jour la DB avec l'URL du PDF dans le bon champ
                const updateData: any = {
                    [dbField]: pdfUrl,
                    lastPdfGeneratedAt: new Date(),
                    updatedAt: new Date(),
                };

                await db
                    .update(bookings)
                    .set(updateData)
                    .where(eq(bookings.id, bookingId));

                console.log(`[Generate PDF] PDF uploadé et sauvegardé: ${pdfUrl}`);
            } catch (uploadError) {
                console.error('[Generate PDF] Erreur upload Blob:', uploadError);
                return NextResponse.json(
                    { 
                        success: false,
                        message: 'Erreur lors de l\'upload du PDF',
                        error: uploadError instanceof Error ? uploadError.message : 'Erreur inconnue'
                    },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { 
                    success: false,
                    message: 'BLOB_READ_WRITE_TOKEN non configuré',
                },
                { status: 500 }
            );
        }

        // Retourner les informations JSON pour que le frontend puisse gérer
        return NextResponse.json({
            success: true,
            url: pdfUrl,
            filename: filename,
            type: type,
            bookingId: bookingId,
            message: `${type === 'facture' ? 'Facture' : type === 'devis' ? 'Devis' : type === 'bon' ? 'Bon de commande' : 'Bon de réservation'} généré avec succès`,
            actions: {
                download: pdfUrl,
                sendToClient: `/api/admin/bookings/${bookingId}/send-document?type=${type}&recipient=client`,
                sendToDriver: `/api/admin/bookings/${bookingId}/send-document?type=${type}&recipient=driver`,
            }
        });

    } catch (error) {
        console.error('[Generate PDF] Erreur:', error);
        return NextResponse.json(
            { 
                success: false,
                message: 'Erreur lors de la génération du PDF',
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}
