import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
} from '@react-email/components';
import type { Booking } from '@/lib/db/schema';

interface OTPVerificationEmailProps {
    booking: Partial<Booking>;
    otpCode: string;
}

export default function OTPVerificationEmail({
    booking,
    otpCode,
}: OTPVerificationEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={heading}>MobiService VTC</Text>
                        <Text style={subheading}>Code de vérification</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={paragraph}>
                            Bonjour <strong>{booking.guestName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            Vous avez choisi de payer en espèces. Pour confirmer votre réservation,
                            veuillez entrer le code de vérification ci-dessous :
                        </Text>

                        <Section style={otpSection}>
                            <Text style={otpLabel}>Votre code de vérification</Text>
                            <Text style={otpCodeStyle}>{otpCode}</Text>
                            <Text style={otpNote}>Ce code expire dans 10 minutes</Text>
                        </Section>

                        <Section style={summaryBox}>
                            <Text style={summaryTitle}>Récapitulatif de votre réservation</Text>
                            <Text style={detailLine}>
                                <strong>Date :</strong>{' '}
                                {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Heure :</strong> {booking.pickupTime}
                            </Text>
                            <Text style={detailLine}>
                                <strong>De :</strong> {booking.pickupAddress}
                            </Text>
                            <Text style={detailLine}>
                                <strong>À :</strong> {booking.dropoffAddress}
                            </Text>
                            <Text style={priceBox}>
                                <strong>Montant à payer (espèces) :</strong> {booking.totalPrice}€
                            </Text>
                        </Section>

                        <Text style={warningText}>
                            ⚠️ Si vous n'avez pas demandé ce code, ignorez cet email.
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

const otpSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
    padding: '32px',
    backgroundColor: '#0A0A0A',
    borderRadius: '12px',
};

const otpLabel = {
    fontSize: '14px',
    color: '#ffffff',
    opacity: 0.7,
    margin: '0 0 12px 0',
};

const otpCodeStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#5CD85A',
    letterSpacing: '12px',
    margin: '0',
    fontFamily: 'monospace',
};

const otpNote = {
    fontSize: '13px',
    color: '#ffffff',
    opacity: 0.5,
    margin: '12px 0 0 0',
};

const summaryBox = {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const summaryTitle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#0A0A0A',
    margin: '0 0 12px 0',
};

const detailLine = {
    fontSize: '14px',
    lineHeight: '24px',
    margin: '4px 0',
    color: '#333',
};

const priceBox = {
    fontSize: '16px',
    color: '#0A0A0A',
    backgroundColor: '#e8f8e7',
    padding: '12px',
    borderRadius: '6px',
    margin: '16px 0 0 0',
    textAlign: 'center' as const,
};

const warningText = {
    fontSize: '13px',
    color: '#666',
    textAlign: 'center' as const,
    margin: '24px 0',
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
