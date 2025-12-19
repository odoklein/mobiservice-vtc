import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
} from '@react-email/components';
import type { Booking } from '@/lib/db/schema';

interface BookingConfirmationEmailProps {
    booking: Partial<Booking>;
    otpCode: string;
    confirmationUrl: string;
}

export default function BookingConfirmationEmail({
    booking,
    otpCode,
    confirmationUrl,
}: BookingConfirmationEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={heading}>MobiService VTC</Text>
                        <Text style={subheading}>Confirmation de réservation</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={paragraph}>
                            Bonjour <strong>{booking.guestName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            Votre réservation a bien été enregistrée. Voici les détails :
                        </Text>

                        <Section style={detailsBox}>
                            <Text style={detailLine}>
                                <strong>Réservation #</strong> {booking.id}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Date :</strong>{' '}
                                {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Heure :</strong> {booking.pickupTime}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Départ :</strong> {booking.pickupAddress}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Arrivée :</strong> {booking.dropoffAddress}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Passagers :</strong> {booking.passengers}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Montant :</strong> {booking.totalPrice}€
                            </Text>
                        </Section>

                        <Hr style={divider} />

                        <Section style={otpSection}>
                            <Text style={otpLabel}>Code de confirmation :</Text>
                            <Text style={otpCode}>{otpCode}</Text>
                            <Text style={otpNote}>Ce code est valable 10 minutes</Text>
                        </Section>

                        <Button href={confirmationUrl} style={button}>
                            Confirmer ma réservation
                        </Button>

                        <Text style={paragraph}>
                            Ou cliquez sur ce lien :{' '}
                            <a href={confirmationUrl} style={link}>
                                {confirmationUrl}
                            </a>
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            MobiService VTC - Transport premium en Haute-Savoie
                        </Text>
                        <Text style={footerText}>
                            📞 +33 6 00 00 00 00 | ✉️ contact@mobiservice-vtc.com
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const header = {
    padding: '32px 40px',
    backgroundColor: '#0A0A0A',
    textAlign: 'center' as const,
};

const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#5CD85A',
    margin: '0',
};

const subheading = {
    fontSize: '16px',
    color: '#ffffff',
    margin: '8px 0 0 0',
};

const content = {
    padding: '0 40px',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#333',
};

const detailsBox = {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const detailLine = {
    fontSize: '14px',
    lineHeight: '24px',
    margin: '4px 0',
    color: '#333',
};

const divider = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const otpSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const otpLabel = {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 8px 0',
};

const otpCode = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#0A0A0A',
    letterSpacing: '8px',
    margin: '0',
    fontFamily: 'monospace',
};

const otpNote = {
    fontSize: '12px',
    color: '#999',
    margin: '8px 0 0 0',
};

const button = {
    backgroundColor: '#5CD85A',
    borderRadius: '8px',
    color: '#0A0A0A',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '16px 32px',
    margin: '24px auto',
    maxWidth: '300px',
};

const link = {
    color: '#5CD85A',
    textDecoration: 'underline',
};

const footer = {
    padding: '32px 40px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e6ebf1',
};

const footerText = {
    fontSize: '12px',
    color: '#999',
    margin: '4px 0',
};
