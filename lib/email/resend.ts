import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - emails will not be sent');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// RESEND_FROM_EMAIL peut valoir "contact@domaine.fr" ou "MobiService VTC <contact@domaine.fr>"
const RAW_FROM = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim().replace(/^["']|["']$/g, '');

/** Adresse seule, pour l'afficher dans un email ("contactez-nous à ..."). */
export const FROM_ADDRESS = (RAW_FROM.match(/<([^>]+)>/)?.[1] ?? RAW_FROM).trim();

/** Expéditeur Resend complet : "MobiService VTC <adresse>" (jamais imbriqué deux fois). */
export const FROM_EMAIL = RAW_FROM.includes('<') ? RAW_FROM : `MobiService VTC <${FROM_ADDRESS}>`;

/**
 * Envoie un email et lève une erreur si Resend la renvoie.
 * Le SDK ne lève pas d'exception : il renvoie { data, error }, donc un échec
 * (domaine non vérifié, adresse refusée...) passait pour un envoi réussi.
 */
export async function sendEmailOrThrow(
    client: Pick<typeof resend, 'emails'>,
    payload: Parameters<typeof resend.emails.send>[0]
) {
    const result = await client.emails.send(payload);
    if (result.error) {
        throw new Error(`Resend: ${result.error.name} - ${result.error.message}`);
    }
    return result.data;
}
