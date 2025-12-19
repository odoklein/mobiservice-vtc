import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import type { Booking } from '@/lib/db/schema';

interface BookingSuccessEmailProps {
    booking: Partial<Booking>;
    paymentMethod: 'card' | 'cash';
}

export default function BookingSuccessEmail({
    booking,
    paymentMethod,
}: BookingSuccessEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={heading}>MobiService VTC</Text>
                        <Text style={subheading}>🎉 Réservation Confirmée</Text>
                    </Section>

                    <Section style={content}>
                        <Section style={successBadge}>
                            <Text style={successIcon}>✓</Text>
                            <Text style={successText}>Votre réservation est confirmée !</Text>
                        </Section>

                        <Text style={paragraph}>
                            Bonjour <strong>{booking.guestName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            Nous avons bien enregistré votre réservation. Votre chauffeur vous attendra à l'adresse indiquée.
                        </Text>

                        <Section style={detailsBox}>
                            <Text style={sectionTitle}>📋 Détails de la réservation</Text>
                            <Text style={detailLine}>
                                <strong>Réservation #</strong> {booking.id}
                            </Text>
                            <Text style={detailLine}>
                                <strong>Date :</strong>{' '}
                                {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : ''}
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
                                <strong>Bagages :</strong> {booking.luggage || 0}
                            </Text>
                        </Section>

                        <Hr style={divider} />

                        <Section style={paymentBox}>
                            <Text style={sectionTitle}>💳 Paiement</Text>
                            <Text style={detailLine}>
                                <strong>Mode de paiement :</strong>{' '}
                                {paymentMethod === 'card' ? 'Carte bancaire (payé)' : 'Espèces (à bord)'}
                            </Text>
                            <Text style={priceTotal}>
                                <strong>Montant total :</strong> {booking.totalPrice}€
                            </Text>
                            {paymentMethod === 'cash' && (
                                <Text style={cashNote}>
                                    ⚠️ Le paiement sera effectué en espèces directement au chauffeur.
                                </Text>
                            )}
                        </Section>

                        <Hr style={divider} />

                        <Section style={tipsBox}>
                            <Text style={sectionTitle}>💡 Conseils</Text>
                            <Text style={tip}>• Soyez prêt(e) à l'heure indiquée</Text>
                            <Text style={tip}>• Votre chauffeur vous contactera si besoin</Text>
                            <Text style={tip}>• En cas de retard, prévenez-nous</Text>
                        </Section>
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

const successBadge = {
    textAlign: 'center' as const,
    margin: '32px 0',
    padding: '24px',
    backgroundColor: '#e8f8e7',
    borderRadius: '12px',
};

const successIcon = {
    fontSize: '48px',
    color: '#5CD85A',
    margin: '0',
};

const successText = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0A0A0A',
    margin: '8px 0 0 0',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#333',
};

const sectionTitle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#0A0A0A',
    margin: '0 0 12px 0',
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
    margin: '24px 0',
};

const paymentBox = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    borderLeft: '4px solid #5CD85A',
};

const priceTotal = {
    fontSize: '18px',
    color: '#0A0A0A',
    margin: '12px 0',
};

const cashNote = {
    fontSize: '13px',
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '10px',
    borderRadius: '4px',
    margin: '12px 0 0 0',
};

const tipsBox = {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const tip = {
    fontSize: '14px',
    color: '#666',
    margin: '6px 0',
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
