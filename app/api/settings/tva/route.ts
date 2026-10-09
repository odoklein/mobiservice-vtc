import { NextResponse } from 'next/server';
import { getInvoiceSettings } from '@/lib/settings/company-settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/tva
 * Réglages TVA exposés au site public (gérés par l'admin dans Paramètres > Factures).
 */
export async function GET() {
  const s = await getInvoiceSettings();
  return NextResponse.json({
    tvaApplicable: s.tvaApplicable,
    tvaRate: s.tvaRate,
    tvaDisplayClient: s.tvaDisplayClient,
    tvaLegalMention: s.tvaLegalMention,
  });
}
