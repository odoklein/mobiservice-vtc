import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DRIVER_RECIPIENTS } from '@/lib/constants';
import { FROM_EMAIL, sendEmailOrThrow, EMAIL_ENABLED } from '@/lib/email/resend';

/**
 * POST /api/contact
 * Formulaire de contact du site : le message est envoyé par email à Patrice
 * (ses deux boîtes), avec le client en adresse de réponse.
 */
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(120),
  email: z.string().trim().email('Email invalide').max(200),
  phone: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().min(5, 'Message trop court').max(5000),
  // Champ piège invisible : rempli seulement par les robots
  website: z.string().optional(),
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function POST(request: NextRequest) {
  let data: z.infer<typeof contactSchema>;
  try {
    data = contactSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.errors[0]?.message : 'Données invalides';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  // Robot : on répond « envoyé » sans rien envoyer
  if (data.website) return NextResponse.json({ success: true });

  if (!EMAIL_ENABLED) {
    console.error('[CONTACT] no email provider configured, message not sent');
    return NextResponse.json(
      { success: false, error: "L'envoi est momentanément indisponible. Merci d'appeler ou d'écrire directement." },
      { status: 503 }
    );
  }

  try {
    await sendEmailOrThrow({
      from: FROM_EMAIL,
      to: DRIVER_RECIPIENTS,
      replyTo: data.email,
      subject: `✉️ Message du site - ${data.name}`,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A0A0A; padding: 24px; text-align: center;">
          <h1 style="color: #5CD85A; margin: 0; font-size: 24px;">MobiService VTC</h1>
          <p style="color: #fff; margin: 8px 0 0 0;">Nouveau message depuis le formulaire de contact</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 4px 0;"><strong>Nom :</strong> ${esc(data.name)}</p>
          <p style="margin: 4px 0;"><strong>Email :</strong> ${esc(data.email)}</p>
          ${data.phone ? `<p style="margin: 4px 0;"><strong>Téléphone :</strong> ${esc(data.phone)}</p>` : ''}
          <div style="background: #f6f6f6; padding: 16px; border-radius: 8px; margin-top: 16px; white-space: pre-line;">${esc(data.message)}</div>
          <p style="color: #666; font-size: 13px; margin-top: 16px;">Répondez directement à cet email pour écrire au client.</p>
        </div>
      </div>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONTACT] Failed to send contact email:', error);
    return NextResponse.json(
      { success: false, error: "Le message n'a pas pu être envoyé. Merci d'appeler ou d'écrire directement." },
      { status: 502 }
    );
  }
}
