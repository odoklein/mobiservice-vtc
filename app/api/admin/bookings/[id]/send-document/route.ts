import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { resend, FROM_EMAIL } from '@/lib/email/resend';

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
        const type = searchParams.get('type'); // 'bon', 'facture', 'devis', 'bdr'
        const recipient = searchParams.get('recipient'); // 'client' or 'driver'

        console.log(`[Send Document] Booking: ${bookingId}, Type: ${type}, Recipient: ${recipient}`);

        // Récupérer la réservation
        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        // Déterminer l'URL du PDF
        let pdfUrl = '';
        let documentName = '';

        if (type === 'facture' && booking.facturePdfUrl) {
            pdfUrl = booking.facturePdfUrl;
            documentName = 'Facture';
        } else if (type === 'devis' && booking.devisPdfUrl) {
            pdfUrl = booking.devisPdfUrl;
            documentName = 'Devis';
        } else if (type === 'bon' && booking.bonCommandePdfUrl) {
            pdfUrl = booking.bonCommandePdfUrl;
            documentName = 'Bon de commande';
        } else if (type === 'bdr' && booking.bonReservationPdfUrl) {
            pdfUrl = booking.bonReservationPdfUrl;
            documentName = 'Bon de réservation';
        } else {
            return NextResponse.json(
                { success: false, message: 'Document non trouvé. Veuillez d\'abord générer le document.' },
                { status: 404 }
            );
        }

        // Déterminer le destinataire
        let recipientEmail = '';
        let recipientName = '';

        if (recipient === 'client') {
            recipientEmail = booking.guestEmail || '';
            recipientName = booking.guestName || 'Client';
        } else if (recipient === 'driver') {
            recipientEmail = process.env.DRIVER_EMAIL || '';
            recipientName = 'Chauffeur';
        } else {
            return NextResponse.json(
                { success: false, message: 'Destinataire invalide (client ou driver)' },
                { status: 400 }
            );
        }

        if (!recipientEmail) {
            return NextResponse.json(
                { success: false, message: `Email ${recipient === 'client' ? 'du client' : 'du chauffeur'} non trouvé` },
                { status: 400 }
            );
        }

        // Envoyer l'email avec le lien vers le PDF
        const subject = `${documentName} - Réservation #${bookingId}`;
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #00FF88; margin: 0; font-size: 28px;">MobiService VTC</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0;">${documentName}</p>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin-top: 0;">Bonjour <strong>${recipientName}</strong>,</p>
        
        <p>Votre ${documentName.toLowerCase()} pour la réservation <strong>#${bookingId}</strong> est disponible.</p>

        <div style="background: #f5f5f5; border-left: 4px solid #00FF88; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>📅 Détails de la réservation:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 13px;">
                Date: ${new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à ${booking.pickupTime}<br>
                De: ${booking.pickupAddress}<br>
                À: ${booking.dropoffAddress}<br>
                ${booking.passengers} passager(s) | ${booking.luggage} bagage(s)
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" target="_blank" style="display: inline-block; background: #00FF88; color: #000000; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📄 Télécharger ${documentName}
            </a>
        </div>

        <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Ce document est également accessible directement via le lien ci-dessus.
        </p>

        <p style="margin-bottom: 0;">
            Cordialement,<br>
            <strong>L'équipe MobiService VTC</strong>
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>MobiService VTC - Transport premium en Haute-Savoie</p>
        <p>📞 +33 (0)6 07 72 50 07 | 📧 contact@mobiservice-vtc.fr</p>
    </div>
</body>
</html>
        `;

        const text = `
Bonjour ${recipientName},

Votre ${documentName.toLowerCase()} pour la réservation #${bookingId} est disponible.

Détails de la réservation:
- Date: ${new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à ${booking.pickupTime}
- De: ${booking.pickupAddress}
- À: ${booking.dropoffAddress}
- ${booking.passengers} passager(s) | ${booking.luggage} bagage(s)

Télécharger le document:
${pdfUrl}

Cordialement,
L'équipe MobiService VTC

---
MobiService VTC - Transport premium en Haute-Savoie
+33 (0)6 07 72 50 07 | contact@mobiservice-vtc.fr
        `;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject,
            html,
            text,
        });

        console.log(`[Send Document] Email envoyé à ${recipientEmail}`);

        return NextResponse.json({
            success: true,
            message: `${documentName} envoyé avec succès à ${recipientEmail}`,
            recipient: recipientEmail,
        });

    } catch (error) {
        console.error('[Send Document] Erreur:', error);
        return NextResponse.json(
            { 
                success: false,
                message: 'Erreur lors de l\'envoi du document',
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}


