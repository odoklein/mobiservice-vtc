import { NextResponse } from 'next/server';
import { getPricingConfig } from '@/lib/services/pricing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pricing/forfaits
 *
 * Forfaits horaires (mise à disposition) définis dans l'admin, proposés sur la page de réservation.
 */
export async function GET() {
  try {
    const config = await getPricingConfig();
    return NextResponse.json({
      success: true,
      forfaits: config.forfaits.map(({ hours, maxKm }) => ({ hours, maxKm })),
    });
  } catch (error) {
    console.error('Error loading hourly forfaits:', error);
    return NextResponse.json({ success: false, forfaits: [] }, { status: 500 });
  }
}
