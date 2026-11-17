import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bookings, type Booking } from '@/lib/db/schema';
import { getAllSettings } from '@/lib/settings/company-settings';
import { InvoicePDF } from '@/lib/pdf/react-pdf-generator';

export type BookingPdfType = 'facture' | 'devis' | 'bon' | 'bdr';

export const PDF_TYPES: Record<BookingPdfType, {
  label: string;
  prefix: string;
  dbField: 'facturePdfUrl' | 'devisPdfUrl' | 'bonCommandePdfUrl' | 'bonReservationPdfUrl';
}> = {
  facture: { label: 'Facture', prefix: 'facture', dbField: 'facturePdfUrl' },
  devis: { label: 'Devis', prefix: 'devis', dbField: 'devisPdfUrl' },
  bon: { label: 'Bon de commande', prefix: 'bon-commande', dbField: 'bonCommandePdfUrl' },
  bdr: { label: 'Bon de réservation', prefix: 'bon-reservation', dbField: 'bonReservationPdfUrl' },
};

export const isPdfType = (t: string | null): t is BookingPdfType => !!t && t in PDF_TYPES;

/** Lien (réservé à l'admin) qui génère le PDF à la demande : il ne dépend d'aucun stockage externe. */
export const adminPdfPath = (bookingId: number, type: BookingPdfType) =>
  `/api/admin/bookings/${bookingId}/pdf?type=${type}`;

/** Génère le PDF d'un document pour une réservation. Renvoie null si la réservation n'existe pas. */
export async function renderBookingPdf(bookingId: number, type: BookingPdfType): Promise<{
  buffer: Buffer;
  filename: string;
  booking: Booking;
} | null> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return null;

  const { company, invoice } = await getAllSettings();
  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF as React.ComponentType<any>, { type, booking, company, invoice }) as any
  );
  return {
    buffer: Buffer.from(buffer),
    filename: `${PDF_TYPES[type].prefix}-${bookingId}.pdf`,
    booking,
  };
}
