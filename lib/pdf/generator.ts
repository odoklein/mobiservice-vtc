import fs from 'fs/promises';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Booking } from '@/lib/db/schema';

// For now, we'll generate simple HTML that can be converted to PDF
// In a production environment, you'd use something like Puppeteer or a PDF service

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
  </div>

  <div class="total">
    <div class="total-line">
      <span>Montant HT</span>
      <span>${booking.basePrice}€</span>
    </div>
    <div class="total-line">
      <span>TVA (10%)</span>
      <span>${booking.tvaAmount || '0'}€</span>
    </div>
    <div class="total-line total-final">
      <span>Total TTC</span>
      <span>${booking.totalPrice}€</span>
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

export async function generateFacture(booking: Booking): Promise<string> {
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
            <strong>Service VTC ${booking.serviceType}</strong><br>
            <small>De ${booking.pickupAddress} à ${booking.dropoffAddress}</small><br>
            <small>Distance: ${booking.distance} km - ${booking.passengers} passager(s)</small>
          </td>
          <td style="text-align: right;">1</td>
          <td style="text-align: right;">${booking.basePrice}€</td>
          <td style="text-align: right;">${booking.basePrice}€</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-line">
      <span>Sous-total HT</span>
      <span>${booking.basePrice}€</span>
    </div>
    <div class="total-line">
      <span>TVA (10%)</span>
      <span>${booking.tvaAmount || '0'}€</span>
    </div>
    <div class="total-final">
      <div style="display: flex; justify-content: space-between;">
        <span>Total TTC</span>
        <span class="amount">${booking.totalPrice}€</span>
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

/**
 * Génère un Devis (Quote/Estimate) avec validité 5 jours
 */
export async function generateDevis(booking: Booking): Promise<string> {
    const quoteNumber = `DEV-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 5); // Validité 5 jours

    // Récupérer le breakdown depuis priceBreakdown JSON
    const breakdown = booking.priceBreakdown as any || {};
    const tripTypeLabel = booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { background: white; padding: 40px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #00FF88; padding-bottom: 20px; }
    .header h1 { color: #0A0A0A; margin: 0; font-size: 32px; }
    .header .quote-number { color: #00FF88; font-size: 18px; font-weight: bold; margin-top: 10px; }
    .company-info { text-align: center; color: #666; font-size: 14px; margin-top: 10px; }
    .validity { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .validity strong { color: #856404; }
    .details { margin: 30px 0; }
    .detail-section { margin: 20px 0; }
    .detail-section h3 { color: #0A0A0A; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-label { font-weight: 600; color: #333; }
    .detail-value { color: #666; }
    .breakdown { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .breakdown-label { color: #666; }
    .breakdown-value { font-weight: 600; color: #333; }
    .breakdown-ca { color: #999; font-size: 0.9em; } /* CA masqué mais visible en PDF */
    .total { margin-top: 30px; padding: 25px; background: #0A0A0A; border-radius: 8px; color: white; }
    .total-line { display: flex; justify-content: space-between; margin: 8px 0; }
    .total-final { font-size: 28px; font-weight: bold; color: #00FF88; margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.2); }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; font-size: 12px; color: #999; }
    .cgv-note { background: #e8f4f8; padding: 15px; border-radius: 4px; margin-top: 20px; font-size: 12px; color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DEVIS</h1>
      <div class="quote-number">${quoteNumber}</div>
      <div class="company-info">
        <strong>MobiService VTC</strong><br>
        Transport Premium en Haute-Savoie<br>
        4 rue des artisans, 74300 Cluses
      </div>
    </div>

    <div class="validity">
      <strong>⚠️ Validité du devis:</strong> 5 jours à compter du ${new Date().toLocaleDateString('fr-FR')}<br>
      <strong>Date limite d'acceptation:</strong> ${validUntil.toLocaleDateString('fr-FR')}
    </div>

    <div class="details">
      <div class="detail-section">
        <h3>Informations client</h3>
        <div class="detail-row">
          <span class="detail-label">Nom</span>
          <span class="detail-value">${booking.guestName || 'À compléter'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${booking.guestEmail || 'À compléter'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Téléphone</span>
          <span class="detail-value">${booking.guestPhone || 'À compléter'}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Détails du trajet</h3>
        <div class="detail-row">
          <span class="detail-label">Type de trajet</span>
          <span class="detail-value">${tripTypeLabel}</span>
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
        ${booking.rateType ? `
        <div class="detail-row">
          <span class="detail-label">Tarif appliqué</span>
          <span class="detail-value">${booking.rateType}</span>
        </div>
        ` : ''}
      </div>

      <div class="breakdown">
        <h3 style="margin-top: 0; color: #0A0A0A;">Détail de la tarification</h3>
        ${breakdown.costCA_out ? `
        <div class="breakdown-row breakdown-ca">
          <span class="breakdown-label">Coût additionnel (dépôt → prise en charge)</span>
          <span class="breakdown-value">${parseFloat(breakdown.costCA_out || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.costTP ? `
        <div class="breakdown-row">
          <span class="breakdown-label">Trajet principal (prise en charge → destination)</span>
          <span class="breakdown-value">${parseFloat(breakdown.costTP || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.costCA_return && booking.tripType === 'round-trip' ? `
        <div class="breakdown-row breakdown-ca">
          <span class="breakdown-label">Coût additionnel (destination → dépôt)</span>
          <span class="breakdown-value">${parseFloat(breakdown.costCA_return || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.tollCost ? `
        <div class="breakdown-row">
          <span class="breakdown-label">Péages</span>
          <span class="breakdown-value">${parseFloat(breakdown.tollCost || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.isForfaitAgglomeration ? `
        <div class="breakdown-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
          <span class="breakdown-label"><strong>Forfait agglomération (≤25km A/R)</strong></span>
          <span class="breakdown-value"><strong>${parseFloat(booking.totalPrice || '0').toFixed(2)}€</strong></span>
        </div>
        ` : ''}
      </div>

      <div class="total">
        <div class="total-line">
          <span>Montant HT</span>
          <span>${parseFloat(booking.totalPriceHT || booking.basePrice || '0').toFixed(2)}€</span>
        </div>
        <div class="total-line">
          <span>TVA (10%)</span>
          <span>${parseFloat(booking.tvaAmount || '0').toFixed(2)}€</span>
        </div>
        <div class="total-final">
          <span>Total TTC</span>
          <span>${parseFloat(booking.totalPrice || '0').toFixed(2)}€</span>
        </div>
      </div>

      <div class="cgv-note">
        <strong>📋 Conditions générales de vente:</strong><br>
        L'acceptation de ce devis s'accompagnera d'un bon de réservation. Les prestations sont payables en partie ou en totalité à l'avance, remboursement sous conditions (voir CGV).<br>
        <a href="/documents" style="color: #0066cc;">Consulter les CGV et la grille tarifaire</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>MobiService VTC</strong> - Transport premium en Haute-Savoie</p>
      <p>SIRET: XXX XXX XXX XXXXX | TVA: FRXX XXX XXX XXX</p>
      <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
</body>
</html>
  `;

    return html;
}

/**
 * Génère un Bon de Réservation (BDR) avec tous les détails
 */
export async function generateBonDeReservation(booking: Booking): Promise<string> {
    const bdrNumber = `BDR-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;
    const tripTypeLabel = booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)';
    
    // Récupérer le breakdown depuis priceBreakdown JSON
    const breakdown = booking.priceBreakdown as any || {};

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { background: white; padding: 40px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #00FF88; padding-bottom: 20px; }
    .header h1 { color: #0A0A0A; margin: 0; font-size: 32px; }
    .header .bdr-number { color: #00FF88; font-size: 18px; font-weight: bold; margin-top: 10px; }
    .company-info { text-align: center; color: #666; font-size: 14px; margin-top: 10px; }
    .details { margin: 30px 0; }
    .detail-section { margin: 20px 0; }
    .detail-section h3 { color: #0A0A0A; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-label { font-weight: 600; color: #333; }
    .detail-value { color: #666; }
    .breakdown { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .breakdown-label { color: #666; }
    .breakdown-value { font-weight: 600; color: #333; }
    .breakdown-ca { color: #999; font-size: 0.9em; } /* CA visible en PDF */
    .total { margin-top: 30px; padding: 25px; background: #0A0A0A; border-radius: 8px; color: white; }
    .total-line { display: flex; justify-content: space-between; margin: 8px 0; }
    .total-final { font-size: 28px; font-weight: bold; color: #00FF88; margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.2); }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; font-size: 12px; color: #999; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-confirmed { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BON DE RÉSERVATION</h1>
      <div class="bdr-number">${bdrNumber}</div>
      <div class="company-info">
        <strong>MobiService VTC</strong><br>
        Transport Premium en Haute-Savoie<br>
        4 rue des artisans, 74300 Cluses
      </div>
    </div>

    <div class="details">
      <div class="detail-section">
        <h3>Informations client</h3>
        <div class="detail-row">
          <span class="detail-label">Nom</span>
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
          <span class="detail-label">Statut réservation</span>
          <span class="detail-value">
            <span class="status-badge ${booking.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}">
              ${booking.status === 'confirmed' ? '✓ Confirmée' : '⏳ En attente'}
            </span>
          </span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Détails du trajet</h3>
        <div class="detail-row">
          <span class="detail-label">Type de trajet</span>
          <span class="detail-value"><strong>${tripTypeLabel}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date de prise en charge</span>
          <span class="detail-value">${new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${booking.pickupTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Départ</span>
          <span class="detail-value">${booking.pickupAddress}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Arrivée</span>
          <span class="detail-value">${booking.dropoffAddress}</span>
        </div>
        ${booking.distanceCA ? `
        <div class="detail-row">
          <span class="detail-label">Distance CA (dépôt → prise en charge)</span>
          <span class="detail-value">${parseFloat(booking.distanceCA || '0').toFixed(1)} km</span>
        </div>
        ` : ''}
        ${booking.distanceTP ? `
        <div class="detail-row">
          <span class="detail-label">Distance TP (trajet principal)</span>
          <span class="detail-value">${parseFloat(booking.distanceTP || '0').toFixed(1)} km</span>
        </div>
        ` : ''}
        ${booking.distanceReturn && booking.tripType === 'round-trip' ? `
        <div class="detail-row">
          <span class="detail-label">Distance retour (destination → dépôt)</span>
          <span class="detail-value">${parseFloat(booking.distanceReturn || '0').toFixed(1)} km</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Distance totale</span>
          <span class="detail-value"><strong>${parseFloat(booking.distance || '0').toFixed(1)} km</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Durée estimée</span>
          <span class="detail-value">~${booking.duration || 0} minutes</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passagers</span>
          <span class="detail-value">${booking.passengers}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Bagages</span>
          <span class="detail-value">${booking.luggage}</span>
        </div>
        ${booking.rateType ? `
        <div class="detail-row">
          <span class="detail-label">Tarif appliqué</span>
          <span class="detail-value">${booking.rateType}</span>
        </div>
        ` : ''}
        ${booking.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes</span>
          <span class="detail-value">${booking.notes}</span>
        </div>
        ` : ''}
      </div>

      <div class="breakdown">
        <h3 style="margin-top: 0; color: #0A0A0A;">Détail de la tarification</h3>
        ${breakdown.costCA_out ? `
        <div class="breakdown-row breakdown-ca">
          <span class="breakdown-label">Coût additionnel (dépôt → prise en charge)</span>
          <span class="breakdown-value">${parseFloat(breakdown.costCA_out || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.costTP ? `
        <div class="breakdown-row">
          <span class="breakdown-label">Trajet principal (prise en charge → destination)</span>
          <span class="breakdown-value">${parseFloat(breakdown.costTP || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.costCA_return && booking.tripType === 'round-trip' ? `
        <div class="breakdown-row breakdown-ca">
          <span class="breakdown-label">Coût additionnel (destination → dépôt)</span>
          <span class="breakdown-value">${parseFloat(breakdown.costCA_return || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.tollCost ? `
        <div class="breakdown-row">
          <span class="breakdown-label">Péages</span>
          <span class="breakdown-value">${parseFloat(breakdown.tollCost || '0').toFixed(2)}€</span>
        </div>
        ` : ''}
        ${breakdown.isForfaitAgglomeration ? `
        <div class="breakdown-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
          <span class="breakdown-label"><strong>Forfait agglomération (≤25km A/R)</strong></span>
          <span class="breakdown-value"><strong>${parseFloat(booking.totalPrice || '0').toFixed(2)}€</strong></span>
        </div>
        ` : ''}
      </div>

      <div class="total">
        <div class="total-line">
          <span>Montant HT</span>
          <span>${parseFloat(booking.totalPriceHT || booking.basePrice || '0').toFixed(2)}€</span>
        </div>
        <div class="total-line">
          <span>TVA (10%)</span>
          <span>${parseFloat(booking.tvaAmount || '0').toFixed(2)}€</span>
        </div>
        <div class="total-line">
          <span>Mode de paiement</span>
          <span>${booking.paymentMethod === 'cash' ? 'Espèces' : 'Carte bancaire'}</span>
        </div>
        <div class="total-line">
          <span>Statut paiement</span>
          <span>${booking.paymentStatus === 'paid' ? '✓ Payé' : '⏳ En attente'}</span>
        </div>
        <div class="total-final">
          <span>Total TTC</span>
          <span>${parseFloat(booking.totalPrice || '0').toFixed(2)}€</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>MobiService VTC</strong> - Transport premium en Haute-Savoie</p>
      <p>SIRET: XXX XXX XXX XXXXX | TVA: FRXX XXX XXX XXX</p>
      <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p style="margin-top: 15px; color: #666;">Ce document confirme votre réservation. Conservez-le pour référence.</p>
    </div>
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
