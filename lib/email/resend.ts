import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Envoi des emails du site.
 *
 * 1. SMTP (serveur BillionMail du VPS) quand SMTP_HOST est configuré ;
 * 2. Resend en secours si le SMTP échoue, ou s'il n'est pas configuré.
 *
 * Variables : SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM,
 * MAIL_REPLY_TO (facultatif), RESEND_API_KEY, RESEND_FROM_EMAIL.
 */

const clean = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '');

const SMTP_HOST = clean(process.env.SMTP_HOST);
const SMTP_USER = clean(process.env.SMTP_USER);
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_PORT = Number(clean(process.env.SMTP_PORT)) || 465;
const SMTP_SECURE = clean(process.env.SMTP_SECURE)
    ? clean(process.env.SMTP_SECURE).toLowerCase() === 'true'
    : SMTP_PORT === 465;
const SMTP_ENABLED = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
const RESEND_ENABLED = !!process.env.RESEND_API_KEY;

/** true si au moins un moyen d'envoi est configuré. */
export const EMAIL_ENABLED = SMTP_ENABLED || RESEND_ENABLED;

if (!EMAIL_ENABLED) {
    console.warn('[EMAIL] Neither SMTP_* nor RESEND_API_KEY is set - emails will not be sent');
}

// Créé seulement au premier envoi : `new Resend()` lève une erreur sans clé, ce qui
// cassait le build quand RESEND_API_KEY n'est pas défini (envoi par SMTP seul).
let resendClient: Resend | null = null;
const getResend = () => (resendClient ??= new Resend(process.env.RESEND_API_KEY));

// MAIL_FROM (ou RESEND_FROM_EMAIL) peut valoir "adresse@domaine.fr" ou "MobiService VTC <adresse@domaine.fr>"
const RAW_FROM = clean(process.env.MAIL_FROM) || clean(process.env.RESEND_FROM_EMAIL) || 'onboarding@resend.dev';

/** Adresse seule. */
export const FROM_ADDRESS = (RAW_FROM.match(/<([^>]+)>/)?.[1] ?? RAW_FROM).trim();

/** Expéditeur complet : "MobiService VTC <adresse>" (jamais imbriqué deux fois). */
export const FROM_EMAIL = RAW_FROM.includes('<') ? RAW_FROM : `MobiService VTC <${FROM_ADDRESS}>`;

/**
 * Adresse de réponse par défaut. L'expéditeur est une adresse noreply@ : sans cela,
 * un client qui clique « Répondre » écrirait dans une boîte que personne ne lit.
 */
const DEFAULT_REPLY_TO = clean(process.env.MAIL_REPLY_TO) || clean(process.env.DRIVER_EMAIL) || 'contact@mobiservice-vtc.fr';

export type MailPayload = {
    from?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string | string[];
    attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

type MailResult =
    | { data: { id: string; via: 'smtp' | 'resend' }; error: null }
    | { data: null; error: { name: string; message: string } };

let transporter: Transporter | null = null;
function smtp(): Transporter {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            connectionTimeout: 15_000,
            greetingTimeout: 10_000,
            socketTimeout: 20_000,
        });
    }
    return transporter;
}

/**
 * Envoie un email. Ne lève pas d'exception : renvoie { data, error }, comme le SDK Resend.
 */
export async function sendMail(payload: MailPayload): Promise<MailResult> {
    const message = {
        ...payload,
        from: payload.from || FROM_EMAIL,
        replyTo: payload.replyTo || DEFAULT_REPLY_TO,
    };
    const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    let smtpError: string | null = null;

    if (SMTP_ENABLED) {
        try {
            const info = await smtp().sendMail(message);
            console.log(`[EMAIL] SMTP sent to ${to}: ${info.messageId}`);
            return { data: { id: info.messageId, via: 'smtp' }, error: null };
        } catch (error) {
            smtpError = error instanceof Error ? error.message : String(error);
            console.error(`[EMAIL] SMTP failed for ${to}: ${smtpError}${RESEND_ENABLED ? ' - trying Resend' : ''}`);
        }
    }

    if (RESEND_ENABLED) {
        const result = await getResend().emails.send({
            from: message.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            replyTo: message.replyTo,
            attachments: message.attachments?.map((x) => ({ filename: x.filename, content: x.content })),
        } as Parameters<Resend['emails']['send']>[0]);
        if (result.error) {
            console.error(`[EMAIL] Resend failed for ${to}: ${result.error.name} - ${result.error.message}`);
            return { data: null, error: { name: result.error.name, message: result.error.message } };
        }
        console.log(`[EMAIL] Resend sent to ${to}: ${result.data?.id}`);
        return { data: { id: result.data?.id || '', via: 'resend' }, error: null };
    }

    return {
        data: null,
        error: { name: smtpError ? 'smtp_error' : 'not_configured', message: smtpError || 'No email provider configured' },
    };
}

/**
 * Envoie un email et lève une erreur en cas d'échec (au lieu de faire passer un échec
 * pour un envoi réussi).
 */
export async function sendEmailOrThrow(payload: MailPayload) {
    const result = await sendMail(payload);
    if (result.error) {
        throw new Error(`Email: ${result.error.name} - ${result.error.message}`);
    }
    return result.data;
}
