import fs from 'fs/promises';
import path from 'path';
import type { Booking } from '@/lib/db/schema';
import { generateFactureEnhanced, generateDevisEnhanced } from './generator-enhanced';

// Enhanced PDF generator with detailed breakdowns
// Supports admin customization via settings

export async function generateBonDeCommande(booking: Booking): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #0A0A0A; margin: 0; }
    .header p { color: #666; margin: 5px 0; }
    .details { margin: 30px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #333; }
    .detail-value { color: #666; }
    .total { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
    .total-final { font-size: 24px; font-weight: bold; color: #5CD85A; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BON DE COMMANDE</h1>
    <p>MobiService VTC - Transport Premium</p>
    <p>Réservation #${booking.id}</p>
  </div>

  <div class="details">
    <div class="detail-row">
      <span class="detail-label">Client</span>
      <span class="detail-value">${booking.guestName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Email</span>
      <span class="detail-value">${booking.guestEmail}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Téléphone</span>
      <span class="detail-value">${booking.guestPhone}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Date de prise en charge</span>
      <span class="detail-value">${new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à ${booking.pickupTime}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Départ</span>
      <span class="detail-value">${booking.pickupAddress}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Arrivée</span>
      <span class="detail-value">${booking.dropoffAddress}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Passagers</span>
      <span class="detail-value">${booking.passengers}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Bagages</span>
      <span class="detail-value">${booking.luggage}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Type de service</span>
      <span class="detail-value">${booking.serviceType}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Type de trajet</span>
      <span class="detail-value">${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</span>
    </div>
    ${booking.distanceTP ? `
    <div class="detail-row">
      <span class="detail-label">Distance avec client</span>
      <span class="detail-value">${booking.distanceTP} km</span>
    </div>
    ` : ''}
  </div>

  <div class="total">
    <div class="total-line">
      <span>Montant HT</span>
      <span>${booking.totalPriceHT || booking.basePrice}€</span>
    </div>
    <div class="total-line">
      <span>TVA (10%)</span>
      <span>${booking.tvaAmount || '0'}€</span>
    </div>
    <div class="total-line total-final">
      <span>Total TTC</span>
      <span>${booking.totalPriceTTC || booking.totalPrice}€</span>
    </div>
  </div>

  <div class="footer">
    <p>MobiService VTC - Haute-Savoie</p>
    <p>SIRET: XXX XXX XXX XXXXX | TVA: FRXX XXX XXX XXX</p>
    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
  </div>
</body>
</html>
  `;

    return html;
}

export async function generateFacture(booking: Booking, companySettings?: any, invoiceSettings?: any): Promise<string> {
    // Use enhanced generator
    return generateFactureEnhanced(booking, companySettings, invoiceSettings);
}

// Legacy function for backward compatibility
export async function generateFactureLegacy(booking: Booking): Promise<string> {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .header h1 { color: #0A0A0A; margin: 0; font-size: 32px; }
    .company-info { text-align: right; color: #666; font-size: 14px; }
    .invoice-info { margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .invoice-info-line { margin: 5px 0; }
    .client-info { margin: 30px 0; }
    .client-info h3 { margin: 0 0 10px 0; }
    .items { margin: 30px 0; }
    .items table { width: 100%; border-collapse: collapse; }
    .items th { background: #0A0A0A; color: white; padding: 12px; text-align: left; }
    .items td { padding: 12px; border-bottom: 1px solid #eee; }
    .totals { margin: 30px 0; max-width: 400px; margin-left: auto; }
    .total-line { display: flex; justify-content: space-between; padding: 10px; }
    .total-final { font-size: 24px; font-weight: bold; background: #0A0A0A; color: white; padding: 15px; border-radius: 8px; }
    .total-final .amount { color: #5CD85A; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>FACTURE</h1>
      <p style="font-size: 18px; color: #5CD85A; margin: 5px 0;">${invoiceNumber}</p>
    </div>
    <div class="company-info">
      <strong>MobiService VTC</strong><br>
      Haute-Savoie, France<br>
      SIRET: XXX XXX XXX XXXXX<br>
      TVA: FRXX XXX XXX XXX
    </div>
  </div>

  <div class="invoice-info">
    <div class="invoice-info-line"><strong>Date d'émission:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
    <div class="invoice-info-line"><strong>Date de service:</strong> ${new Date(booking.pickupDate).toLocaleDateString('fr-FR')}</div>
    <div class="invoice-info-line"><strong>Mode de paiement:</strong> ${booking.paymentMethod === 'cash' ? 'Espèces' : 'Carte bancaire'}</div>
    <div class="invoice-info-line"><strong>Statut:</strong> ${booking.paymentStatus === 'paid' ? 'Payée' : 'En attente'}</div>
  </div>

  <div class="client-info">
    <h3>Facturation à:</h3>
    <p>
      <strong>${booking.guestName}</strong><br>
      ${booking.guestEmail}<br>
      ${booking.guestPhone}
    </p>
  </div>

  <div class="items">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Quantité</th>
          <th style="text-align: right;">Prix unitaire HT</th>
          <th style="text-align: right;">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Service VTC ${booking.serviceType} - ${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</strong><br>
            <small>De ${booking.pickupAddress} à ${booking.dropoffAddress}</small><br>
            <small>Distance trajet avec client: ${booking.distanceTP || booking.distance} km - ${booking.passengers} passager(s)</small>${booking.tripType === 'one-way' ? '<br><small><em>Note: Tarif A/S n\'inclut pas le retour à vide du véhicule</em></small>' : ''}
          </td>
          <td style="text-align: right;">1</td>
          <td style="text-align: right;">${booking.totalPriceHT || booking.basePrice}€</td>
          <td style="text-align: right;">${booking.totalPriceHT || booking.basePrice}€</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-line">
      <span>Sous-total HT</span>
      <span>${booking.totalPriceHT || booking.basePrice}€</span>
    </div>
    <div class="total-line">
      <span>TVA (10%)</span>
      <span>${booking.tvaAmount || '0'}€</span>
    </div>
    <div class="total-final">
      <div style="display: flex; justify-content: space-between;">
        <span>Total TTC</span>
        <span class="amount">${booking.totalPriceTTC || booking.totalPrice}€</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>MobiService VTC</strong> - Transport premium en Haute-Savoie</p>
    <p>Merci de votre confiance</p>
    <p style="margin-top: 20px; font-size: 10px;">
      TVA non applicable, art. 293 B du CGI<br>
      En cas de retard de paiement, application d'une pénalité de 3 fois le taux d'intérêt légal
    </p>
  </div>
</body>
</html>
  `;

    return html;
}

export async function generateBonDeReservation(booking: Booking): Promise<string> {
    // Bon de Réservation is essentially the same as Bon de Commande
    // but generated after booking confirmation
    return generateBonDeCommande(booking);
}

export async function generateDevis(booking: Booking, companySettings?: any, invoiceSettings?: any): Promise<string> {
    // Use enhanced generator
    return generateDevisEnhanced(booking, companySettings, invoiceSettings);
}

// Legacy function for backward compatibility
export async function generateDevisLegacy(booking: Booking): Promise<string> {
    const devisNumber = `DEV-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .header h1 { color: #0A0A0A; margin: 0; font-size: 32px; }
    .company-info { text-align: right; color: #666; font-size: 14px; }
    .devis-info { margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .devis-info-line { margin: 5px 0; }
    .client-info { margin: 30px 0; }
    .client-info h3 { margin: 0 0 10px 0; }
    .items { margin: 30px 0; }
    .items table { width: 100%; border-collapse: collapse; }
    .items th { background: #0A0A0A; color: white; padding: 12px; text-align: left; }
    .items td { padding: 12px; border-bottom: 1px solid #eee; }
    .totals { margin: 30px 0; max-width: 400px; margin-left: auto; }
    .total-line { display: flex; justify-content: space-between; padding: 10px; }
    .total-final { font-size: 24px; font-weight: bold; background: #0A0A0A; color: white; padding: 15px; border-radius: 8px; }
    .total-final .amount { color: #5CD85A; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; font-size: 12px; color: #999; }
    .validity { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>DEVIS</h1>
      <p style="font-size: 18px; color: #5CD85A; margin: 5px 0;">${devisNumber}</p>
    </div>
    <div class="company-info">
      <strong>MobiService VTC</strong><br>
      Haute-Savoie, France<br>
      SIRET: XXX XXX XXX XXXXX<br>
      TVA: FRXX XXX XXX XXX
    </div>
  </div>

  <div class="devis-info">
    <div class="devis-info-line"><strong>Date d'émission:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
    <div class="devis-info-line"><strong>Date de service prévue:</strong> ${new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à ${booking.pickupTime}</div>
    <div class="devis-info-line"><strong>Validité:</strong> 30 jours</div>
  </div>

  <div class="client-info">
    <h3>Client:</h3>
    <p>
      <strong>${booking.guestName || 'Client'}</strong><br>
      ${booking.guestEmail || ''}<br>
      ${booking.guestPhone || ''}
    </p>
  </div>

  <div class="items">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Quantité</th>
          <th style="text-align: right;">Prix unitaire HT</th>
          <th style="text-align: right;">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Service VTC ${booking.serviceType} - ${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</strong><br>
            <small>De ${booking.pickupAddress} à ${booking.dropoffAddress}</small><br>
            <small>Distance trajet avec client: ${booking.distanceTP || booking.distance} km - ${booking.passengers} passager(s)</small>${booking.tripType === 'one-way' ? '<br><small><em>Note: Tarif A/S n\'inclut pas le retour à vide du véhicule</em></small>' : ''}
          </td>
          <td style="text-align: right;">1</td>
          <td style="text-align: right;">${booking.totalPriceHT || booking.basePrice}€</td>
          <td style="text-align: right;">${booking.totalPriceHT || booking.basePrice}€</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-line">
      <span>Sous-total HT</span>
      <span>${booking.totalPriceHT || booking.basePrice}€</span>
    </div>
    <div class="total-line">
      <span>TVA (10%)</span>
      <span>${booking.tvaAmount || '0'}€</span>
    </div>
    <div class="total-final">
      <div style="display: flex; justify-content: space-between;">
        <span>Total TTC</span>
        <span class="amount">${booking.totalPriceTTC || booking.totalPrice}€</span>
      </div>
    </div>
  </div>

  <div class="validity">
    <p style="margin: 0; font-size: 14px; color: #856404;">
      <strong>⚠️ Conditions:</strong><br>
      Ce devis est valable 30 jours à compter de la date d'émission.<br>
      Les prix peuvent varier selon les conditions de circulation et les péages.<br>
      Prix indiqué: ${booking.rateType || 'Tarif standard'}
    </p>
  </div>

  <div class="footer">
    <p><strong>MobiService VTC</strong> - Transport premium en Haute-Savoie</p>
    <p style="margin-top: 20px; font-size: 10px;">
      TVA non applicable, art. 293 B du CGI<br>
      En cas d'acceptation, une confirmation écrite sera requise
    </p>
  </div>
</body>
</html>
  `;

    return html;
}

export async function savePDF(htmlContent: string, filename: string): Promise<string> {
    const documentPath = path.join(process.cwd(), 'public', 'documents', 'bookings');

    // Ensure directory exists
    await fs.mkdir(documentPath, { recursive: true });

    const filepath = path.join(documentPath, `${filename}.html`);

    // For now, save as HTML
    // In production, you'd convert to PDF using Puppeteer or similar
    await fs.writeFile(filepath, htmlContent, 'utf-8');

    return `/documents/bookings/${filename}.html`;
}
