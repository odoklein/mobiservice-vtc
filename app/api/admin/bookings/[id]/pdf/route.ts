import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { isPdfType, renderBookingPdf } from '@/lib/pdf/render-booking-pdf';

/**
 * GET /api/admin/bookings/[id]/pdf?type=facture|devis|bon|bdr[&download=1]
 * Génère et affiche le PDF d'une réservation (admin uniquement).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = parseInt(id);
  const type = request.nextUrl.searchParams.get('type');
  if (isNaN(bookingId) || !isPdfType(type)) {
    return NextResponse.json({ message: 'Paramètres invalides (type : facture, devis, bon ou bdr)' }, { status: 400 });
  }

  try {
    const pdf = await renderBookingPdf(bookingId, type);
    if (!pdf) {
      return NextResponse.json({ message: 'Réservation introuvable' }, { status: 404 });
    }
    const disposition = request.nextUrl.searchParams.get('download') ? 'attachment' : 'inline';
    return new NextResponse(new Uint8Array(pdf.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${pdf.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[PDF] Generation failed:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la génération du PDF', error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
