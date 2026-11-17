import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Lien privé vers la page devis d'une réservation.
 *
 * Les n° de réservation se suivent : sans signature, n'importe qui pourrait agir sur
 * le devis d'un autre client en changeant le n° dans l'URL. Le jeton est un HMAC du
 * n° de réservation, signé avec JWT_SECRET : il n'a pas besoin d'être stocké.
 */
const SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long';

export function quoteToken(bookingId: number): string {
  return createHmac('sha256', SECRET).update(`quote:${bookingId}`).digest('base64url').slice(0, 32);
}

export function isValidQuoteToken(bookingId: number, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(quoteToken(bookingId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** URL de la page devis, avec son jeton. */
export function quoteUrl(appUrl: string, bookingId: number): string {
  return `${appUrl}/quote/${bookingId}?t=${quoteToken(bookingId)}`;
}
