import type { Booking } from '@/lib/db/schema';

// Enhanced invoice/quote generator with detailed breakdowns
// Supports admin customization via settings

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  siret: string;
  tva: string;
  phone: string;
  email: string;
  website?: string;
  bankDetails?: string;
  iban?: string;
  bic?: string;
  paymentTerms?: string;
  footerText?: string;
}

interface InvoiceSettings {
  invoicePrefix: string;
  quotePrefix: string;
  quoteValidityDays: number;
  defaultPaymentTerms: string;
  showDetailedBreakdown: boolean;
  showDistanceSegments: boolean;
  showQRCode?: boolean;
  qrCodeData?: string;
}

// Default settings (can be overridden by admin)
const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'MobiService VTC',
  address: '4 rue des artisans',
  city: 'Cluses',
  postalCode: '74300',
  siret: 'XXX XXX XXX XXXXX',
  tva: 'FRXX XXX XXX XXX',
  phone: '+33 (0)6 07 72 50 07',
  email: 'contact@mobiservice-vtc.fr',
  website: 'www.mobiservice-vtc.fr',
  paymentTerms: 'Paiement à réception de facture',
  footerText: 'MobiService VTC - Transport premium en Haute-Savoie',
};

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  invoicePrefix: 'INV',
  quotePrefix: 'DEV',
  quoteValidityDays: 30,
  defaultPaymentTerms: 'Paiement à réception',
  showDetailedBreakdown: true,
  showDistanceSegments: true,
};

// Helper to parse price breakdown from JSON
function parseBreakdown(booking: Booking) {
  if (!booking.priceBreakdown || typeof booking.priceBreakdown !== 'object') {
    return null;
  }
  const breakdown = booking.priceBreakdown as any;
  return {
    baseFare: breakdown.baseFare || 0,
    distanceCharge: breakdown.distanceCharge || 0,
    hourlyCharge: breakdown.hourlyCharge || 0,
    waitingCharge: breakdown.waitingCharge || 0,
    forfaitDiscount: breakdown.forfaitDiscount || 0,
    forfaitApplied: breakdown.forfaitApplied || false,
    forfaitName: breakdown.forfaitName || null,
  };
}

// Enhanced invoice with detailed breakdown
export async function generateFactureEnhanced(
  booking: Booking,
  companySettings?: Partial<CompanySettings>,
  invoiceSettings?: Partial<InvoiceSettings>
): Promise<string> {
  const company = { ...DEFAULT_COMPANY_SETTINGS, ...companySettings };
  const settings = { ...DEFAULT_INVOICE_SETTINGS, ...invoiceSettings };
  
  const invoiceNumber = `${settings.invoicePrefix}-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;
  const breakdown = parseBreakdown(booking);
  const hasBreakdown = breakdown && settings.showDetailedBreakdown;

  // Calculate distances
  const distanceCA = booking.distanceCA ? parseFloat(booking.distanceCA.toString()) : 0;
  const distanceTP = booking.distanceTP ? parseFloat(booking.distanceTP.toString()) : 0;
  const distanceReturn = booking.distanceReturn ? parseFloat(booking.distanceReturn.toString()) : 0;
  const totalDistance = distanceCA + distanceTP + distanceReturn;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    * { box-sizing: border-box; }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      padding: 40px; 
      margin: 0;
      color: #0A0A0A;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #00FF88;
    }
    .header-left h1 { 
      color: #0A0A0A; 
      margin: 0; 
      font-size: 36px; 
      font-weight: bold;
    }
    .invoice-number { 
      font-size: 18px; 
      color: #00FF88; 
      margin: 5px 0; 
      font-weight: 600;
    }
    .company-info { 
      text-align: right; 
      color: #666; 
      font-size: 13px;
      line-height: 1.8;
    }
    .company-info strong { color: #0A0A0A; font-size: 16px; }
    .info-section { 
      margin: 30px 0; 
      padding: 20px; 
      background: #f9f9f9; 
      border-radius: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-line { margin: 8px 0; }
    .info-line strong { color: #0A0A0A; }
    .client-section { 
      margin: 30px 0; 
      padding: 20px;
      background: #f0f9ff;
      border-left: 4px solid #00FF88;
      border-radius: 4px;
    }
    .client-section h3 { 
      margin: 0 0 15px 0; 
      color: #0A0A0A;
      font-size: 18px;
    }
    .items-section { margin: 30px 0; }
    .items-table { 
      width: 100%; 
      border-collapse: collapse;
      margin-top: 15px;
    }
    .items-table th { 
      background: #0A0A0A; 
      color: white; 
      padding: 15px 12px; 
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    .items-table th.text-right { text-align: right; }
    .items-table td { 
      padding: 15px 12px; 
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .items-table td.text-right { text-align: right; }
    .item-description { 
      font-weight: 600;
      color: #0A0A0A;
      margin-bottom: 8px;
    }
    .item-details { 
      font-size: 12px; 
      color: #666;
      margin-top: 5px;
      line-height: 1.6;
    }
    .breakdown-section {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 6px;
      font-size: 12px;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #eee;
    }
    .breakdown-row:last-child {
      border-bottom: none;
      font-weight: 600;
      margin-top: 8px;
      padding-top: 12px;
      border-top: 2px solid #ddd;
    }
    .distance-segments {
      margin-top: 10px;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 11px;
    }
    .distance-segments strong { color: #0A0A0A; }
    .totals-section { 
      margin: 30px 0; 
      max-width: 400px; 
      margin-left: auto;
    }
    .total-line { 
      display: flex; 
      justify-content: space-between; 
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .total-line.total-final { 
      font-size: 24px; 
      font-weight: bold; 
      background: #0A0A0A; 
      color: white; 
      padding: 20px; 
      border-radius: 8px;
      border: none;
      margin-top: 10px;
    }
    .total-final .amount { color: #00FF88; }
    .bank-info {
      margin-top: 30px;
      padding: 20px;
      background: #f0f0f0;
      border-radius: 8px;
      border-left: 4px solid #00FF88;
    }
    .bank-info h4 {
      margin: 0 0 10px 0;
      color: #000000;
      font-size: 14px;
    }
    .bank-details {
      font-size: 12px;
      line-height: 1.8;
    }
    .qr-code-section {
      margin-top: 30px;
      text-align: center;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .qr-code-section img {
      max-width: 150px;
      height: auto;
    }
    .footer { 
      margin-top: 60px; 
      padding-top: 20px; 
      border-top: 2px solid #eee; 
      text-align: center; 
      font-size: 12px; 
      color: #999;
      line-height: 1.8;
    }
    .footer strong { color: #0A0A0A; }
    .payment-info {
      margin-top: 30px;
      padding: 15px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>FACTURE</h1>
        <div class="invoice-number">${invoiceNumber}</div>
      </div>
      <div class="company-info">
        <strong>${company.name}</strong><br>
        ${company.address}<br>
        ${company.postalCode} ${company.city}, France<br>
        ${company.phone ? `Tél: ${company.phone}<br>` : ''}
        ${company.email ? `Email: ${company.email}<br>` : ''}
        ${company.website ? `Web: ${company.website}<br>` : ''}
        <br>
        SIRET: ${company.siret}<br>
        TVA: ${company.tva}
      </div>
    </div>

    <div class="info-section">
      <div>
        <div class="info-line"><strong>Date d'émission:</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        ${((booking as any).returnDate || (booking as any).return_date) && ((booking as any).returnTime || (booking as any).return_time) ? `
        <div class="info-line"><strong>Trajet Aller (planifié):</strong> ${new Date(booking.pickupDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${booking.pickupTime}</div>
        <div class="info-line"><strong>Trajet Retour (planifié):</strong> ${new Date((booking as any).returnDate || (booking as any).return_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${(booking as any).returnTime || (booking as any).return_time}</div>
        ` : `<div class="info-line"><strong>Date de service:</strong> ${new Date(booking.pickupDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${booking.pickupTime}</div>`}
        <div class="info-line"><strong>Statut:</strong> ${booking.paymentStatus === 'paid' ? '✅ Payée' : '⏳ En attente'}</div>
      </div>
      <div>
        <div class="info-line"><strong>Mode de paiement:</strong> ${booking.paymentMethod === 'cash' ? '💵 Espèces' : '💳 Carte bancaire'}</div>
        <div class="info-line"><strong>Type de service:</strong> ${booking.serviceType}</div>
        <div class="info-line"><strong>Tarif appliqué:</strong> ${booking.rateType || 'Standard'}</div>
      </div>
    </div>

    <div class="client-section">
      <h3>Facturation à:</h3>
      <p style="margin: 0; line-height: 1.8;">
        <strong>${booking.guestName}</strong><br>
        ${booking.guestEmail}<br>
        ${booking.guestPhone}
      </p>
    </div>

    <div class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qté</th>
            <th class="text-right">Prix unitaire HT</th>
            <th class="text-right">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-description">
                Service VTC ${booking.serviceType === 'transfer' ? 'Transfert' : booking.serviceType === 'airport' ? 'Aéroport' : booking.serviceType === 'hourly' ? 'Mise à disposition' : booking.serviceType} - ${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}
              </div>
              <div class="item-details">
                <strong>📍 Trajet:</strong> De ${booking.pickupAddress} à ${booking.dropoffAddress}<br>
                <strong>👥 Passagers:</strong> ${booking.passengers} | <strong>🧳 Bagages:</strong> ${booking.luggage}<br>
                ${settings.showDistanceSegments && distanceCA > 0 ? `
                <div class="distance-segments">
                  <strong>Distances détaillées:</strong><br>
                  • CA (Dépôt → Prise en charge): ${distanceCA.toFixed(1)} km<br>
                  • TP (Trajet avec client): ${distanceTP.toFixed(1)} km<br>
                  • Retour (Dépose → Dépôt): ${distanceReturn.toFixed(1)} km<br>
                  <strong>Total: ${totalDistance.toFixed(1)} km</strong>
                </div>
                ` : booking.distanceTP ? `<strong>Distance:</strong> ${booking.distanceTP} km` : ''}
                ${hasBreakdown && breakdown.forfaitApplied ? `<br><strong>📦 Forfait appliqué:</strong> ${breakdown.forfaitName || 'Forfait'}` : ''}
              </div>
              ${hasBreakdown ? `
              <div class="breakdown-section">
                <strong>Détail du calcul:</strong>
                ${breakdown.baseFare ? `<div class="breakdown-row"><span>Prise en charge</span><span>${breakdown.baseFare.toFixed(2)}€</span></div>` : ''}
                ${breakdown.distanceCharge ? `<div class="breakdown-row"><span>Distance (${totalDistance.toFixed(1)} km)</span><span>${breakdown.distanceCharge.toFixed(2)}€</span></div>` : ''}
                ${breakdown.hourlyCharge ? `<div class="breakdown-row"><span>Heures supplémentaires</span><span>${breakdown.hourlyCharge.toFixed(2)}€</span></div>` : ''}
                ${breakdown.waitingCharge ? `<div class="breakdown-row"><span>Mise à disposition</span><span>${breakdown.waitingCharge.toFixed(2)}€</span></div>` : ''}
                ${breakdown.forfaitDiscount ? `<div class="breakdown-row"><span>Remise forfait</span><span>-${breakdown.forfaitDiscount.toFixed(2)}€</span></div>` : ''}
                <div class="breakdown-row"><span><strong>Sous-total HT</strong></span><span><strong>${(parseFloat(booking.totalPriceHT?.toString() || '0')).toFixed(2)}€</strong></span></div>
              </div>
              ` : ''}
            </td>
            <td class="text-right">1</td>
            <td class="text-right">${(parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0')).toFixed(2)}€</td>
            <td class="text-right">${(parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0')).toFixed(2)}€</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="total-line">
        <span>Sous-total HT</span>
        <span>${(parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0')).toFixed(2)}€</span>
      </div>
      <div class="total-line">
        <span>TVA (10% prestation, 20% péages/MAD)</span>
        <span>${(parseFloat(booking.tvaAmount?.toString() || '0')).toFixed(2)}€</span>
      </div>
      <div class="total-line total-final">
        <span>Total TTC</span>
        <span class="amount">${(parseFloat(booking.totalPriceTTC?.toString() || booking.totalPrice?.toString() || '0')).toFixed(2)}€</span>
      </div>
    </div>

    ${company.paymentTerms ? `
    <div class="payment-info">
      <strong>💳 Conditions de paiement:</strong> ${company.paymentTerms}
    </div>
    ` : ''}

    ${company.iban || company.bankDetails ? `
    <div class="bank-info">
      <h4>🏦 Informations bancaires</h4>
      <div class="bank-details">
        ${company.iban ? `<strong>IBAN:</strong> ${company.iban}<br>` : ''}
        ${company.bic ? `<strong>BIC:</strong> ${company.bic}<br>` : ''}
        ${company.bankDetails ? `${company.bankDetails}` : ''}
      </div>
    </div>
    ` : ''}

    ${settings.showQRCode && settings.qrCodeData ? `
    <div class="qr-code-section">
      <p style="font-size: 12px; margin-bottom: 10px;">Scannez pour payer ou plus d'infos</p>
      <img src="${settings.qrCodeData}" alt="QR Code" />
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>${company.footerText || company.name}</strong></p>
      <p>Merci de votre confiance</p>
      <p style="margin-top: 20px; font-size: 10px; line-height: 1.6;">
        TVA non applicable, art. 293 B du CGI<br>
        En cas de retard de paiement, application d'une pénalité de 3 fois le taux d'intérêt légal<br>
        Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

// Enhanced quote with detailed breakdown
export async function generateDevisEnhanced(
  booking: Booking,
  companySettings?: Partial<CompanySettings>,
  invoiceSettings?: Partial<InvoiceSettings>
): Promise<string> {
  const company = { ...DEFAULT_COMPANY_SETTINGS, ...companySettings };
  const settings = { ...DEFAULT_INVOICE_SETTINGS, ...invoiceSettings };
  
  const devisNumber = `${settings.quotePrefix}-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;
  const breakdown = parseBreakdown(booking);
  const hasBreakdown = breakdown && settings.showDetailedBreakdown;
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + settings.quoteValidityDays);

  // Calculate distances
  const distanceCA = booking.distanceCA ? parseFloat(booking.distanceCA.toString()) : 0;
  const distanceTP = booking.distanceTP ? parseFloat(booking.distanceTP.toString()) : 0;
  const distanceReturn = booking.distanceReturn ? parseFloat(booking.distanceReturn.toString()) : 0;
  const totalDistance = distanceCA + distanceTP + distanceReturn;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    * { box-sizing: border-box; }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      padding: 40px; 
      margin: 0;
      color: #0A0A0A;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #00FF88;
    }
    .header-left h1 { 
      color: #0A0A0A; 
      margin: 0; 
      font-size: 36px; 
      font-weight: bold;
    }
    .devis-number { 
      font-size: 18px; 
      color: #00FF88; 
      margin: 5px 0; 
      font-weight: 600;
    }
    .company-info { 
      text-align: right; 
      color: #666; 
      font-size: 13px;
      line-height: 1.8;
    }
    .company-info strong { color: #0A0A0A; font-size: 16px; }
    .info-section { 
      margin: 30px 0; 
      padding: 20px; 
      background: #f9f9f9; 
      border-radius: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-line { margin: 8px 0; }
    .info-line strong { color: #0A0A0A; }
    .client-section { 
      margin: 30px 0; 
      padding: 20px;
      background: #f0f9ff;
      border-left: 4px solid #00FF88;
      border-radius: 4px;
    }
    .client-section h3 { 
      margin: 0 0 15px 0; 
      color: #0A0A0A;
      font-size: 18px;
    }
    .items-section { margin: 30px 0; }
    .items-table { 
      width: 100%; 
      border-collapse: collapse;
      margin-top: 15px;
    }
    .items-table th { 
      background: #0A0A0A; 
      color: white; 
      padding: 15px 12px; 
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    .items-table th.text-right { text-align: right; }
    .items-table td { 
      padding: 15px 12px; 
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .items-table td.text-right { text-align: right; }
    .item-description { 
      font-weight: 600;
      color: #0A0A0A;
      margin-bottom: 8px;
    }
    .item-details { 
      font-size: 12px; 
      color: #666;
      margin-top: 5px;
      line-height: 1.6;
    }
    .breakdown-section {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 6px;
      font-size: 12px;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #eee;
    }
    .breakdown-row:last-child {
      border-bottom: none;
      font-weight: 600;
      margin-top: 8px;
      padding-top: 12px;
      border-top: 2px solid #ddd;
    }
    .distance-segments {
      margin-top: 10px;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 11px;
    }
    .distance-segments strong { color: #0A0A0A; }
    .totals-section { 
      margin: 30px 0; 
      max-width: 400px; 
      margin-left: auto;
    }
    .total-line { 
      display: flex; 
      justify-content: space-between; 
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .total-line.total-final { 
      font-size: 24px; 
      font-weight: bold; 
      background: #0A0A0A; 
      color: white; 
      padding: 20px; 
      border-radius: 8px;
      border: none;
      margin-top: 10px;
    }
    .total-final .amount { color: #00FF88; }
    .bank-info {
      margin-top: 30px;
      padding: 20px;
      background: #f0f0f0;
      border-radius: 8px;
      border-left: 4px solid #00FF88;
    }
    .bank-info h4 {
      margin: 0 0 10px 0;
      color: #000000;
      font-size: 14px;
    }
    .bank-details {
      font-size: 12px;
      line-height: 1.8;
    }
    .qr-code-section {
      margin-top: 30px;
      text-align: center;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .qr-code-section img {
      max-width: 150px;
      height: auto;
    }
    .validity-box { 
      background: #fff3cd; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 30px 0; 
      border-left: 4px solid #ffc107;
    }
    .validity-box strong { color: #856404; }
    .footer { 
      margin-top: 60px; 
      padding-top: 20px; 
      border-top: 2px solid #eee; 
      text-align: center; 
      font-size: 12px; 
      color: #999;
      line-height: 1.8;
    }
    .footer strong { color: #0A0A0A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>DEVIS</h1>
        <div class="devis-number">${devisNumber}</div>
      </div>
      <div class="company-info">
        <strong>${company.name}</strong><br>
        ${company.address}<br>
        ${company.postalCode} ${company.city}, France<br>
        ${company.phone ? `Tél: ${company.phone}<br>` : ''}
        ${company.email ? `Email: ${company.email}<br>` : ''}
        ${company.website ? `Web: ${company.website}<br>` : ''}
        <br>
        SIRET: ${company.siret}<br>
        TVA: ${company.tva}
      </div>
    </div>

    <div class="info-section">
      <div>
        <div class="info-line"><strong>Date d'émission:</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        <div class="info-line"><strong>Trajet Aller (planifié):</strong> ${new Date(booking.pickupDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${booking.pickupTime}</div>
        ${((booking as any).returnDate || (booking as any).return_date) && ((booking as any).returnTime || (booking as any).return_time) ? `
        <div class="info-line"><strong>Trajet Retour (planifié):</strong> ${new Date((booking as any).returnDate || (booking as any).return_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${(booking as any).returnTime || (booking as any).return_time}</div>
        ` : ''}
        <div class="info-line"><strong>Validité:</strong> ${settings.quoteValidityDays} jours (jusqu'au ${validityDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })})</div>
      </div>
      <div>
        <div class="info-line"><strong>Type de service:</strong> ${booking.serviceType}</div>
        <div class="info-line"><strong>Type de trajet:</strong> ${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</div>
        <div class="info-line"><strong>Tarif appliqué:</strong> ${booking.rateType || 'Standard'}</div>
      </div>
    </div>

    <div class="client-section">
      <h3>Client:</h3>
      <p style="margin: 0; line-height: 1.8;">
        <strong>${booking.guestName || 'Client'}</strong><br>
        ${booking.guestEmail || ''}<br>
        ${booking.guestPhone || ''}
      </p>
    </div>

    <div class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qté</th>
            <th class="text-right">Prix unitaire HT</th>
            <th class="text-right">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-description">
                Service VTC ${booking.serviceType === 'transfer' ? 'Transfert' : booking.serviceType === 'airport' ? 'Aéroport' : booking.serviceType === 'hourly' ? 'Mise à disposition' : booking.serviceType} - ${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}
              </div>
              <div class="item-details">
                <strong>📍 Trajet:</strong> De ${booking.pickupAddress} à ${booking.dropoffAddress}<br>
                <strong>👥 Passagers:</strong> ${booking.passengers} | <strong>🧳 Bagages:</strong> ${booking.luggage}<br>
                ${settings.showDistanceSegments && distanceCA > 0 ? `
                <div class="distance-segments">
                  <strong>Distances détaillées:</strong><br>
                  • CA (Dépôt → Prise en charge): ${distanceCA.toFixed(1)} km<br>
                  • TP (Trajet avec client): ${distanceTP.toFixed(1)} km<br>
                  • Retour (Dépose → Dépôt): ${distanceReturn.toFixed(1)} km<br>
                  <strong>Total: ${totalDistance.toFixed(1)} km</strong>
                </div>
                ` : booking.distanceTP ? `<strong>Distance:</strong> ${booking.distanceTP} km` : ''}
                ${hasBreakdown && breakdown.forfaitApplied ? `<br><strong>📦 Forfait appliqué:</strong> ${breakdown.forfaitName || 'Forfait'}` : ''}
              </div>
              ${hasBreakdown ? `
              <div class="breakdown-section">
                <strong>Détail du calcul:</strong>
                ${breakdown.baseFare ? `<div class="breakdown-row"><span>Prise en charge</span><span>${breakdown.baseFare.toFixed(2)}€</span></div>` : ''}
                ${breakdown.distanceCharge ? `<div class="breakdown-row"><span>Distance (${totalDistance.toFixed(1)} km)</span><span>${breakdown.distanceCharge.toFixed(2)}€</span></div>` : ''}
                ${breakdown.hourlyCharge ? `<div class="breakdown-row"><span>Heures supplémentaires</span><span>${breakdown.hourlyCharge.toFixed(2)}€</span></div>` : ''}
                ${breakdown.waitingCharge ? `<div class="breakdown-row"><span>Mise à disposition</span><span>${breakdown.waitingCharge.toFixed(2)}€</span></div>` : ''}
                ${breakdown.forfaitDiscount ? `<div class="breakdown-row"><span>Remise forfait</span><span>-${breakdown.forfaitDiscount.toFixed(2)}€</span></div>` : ''}
                <div class="breakdown-row"><span><strong>Sous-total HT</strong></span><span><strong>${(parseFloat(booking.totalPriceHT?.toString() || '0')).toFixed(2)}€</strong></span></div>
              </div>
              ` : ''}
            </td>
            <td class="text-right">1</td>
            <td class="text-right">${(parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0')).toFixed(2)}€</td>
            <td class="text-right">${(parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0')).toFixed(2)}€</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="total-line">
        <span>Sous-total HT</span>
        <span>${(parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0')).toFixed(2)}€</span>
      </div>
      <div class="total-line">
        <span>TVA (10% prestation, 20% péages/MAD)</span>
        <span>${(parseFloat(booking.tvaAmount?.toString() || '0')).toFixed(2)}€</span>
      </div>
      <div class="total-line total-final">
        <span>Total TTC</span>
        <span class="amount">${(parseFloat(booking.totalPriceTTC?.toString() || booking.totalPrice?.toString() || '0')).toFixed(2)}€</span>
      </div>
    </div>

    <div class="validity-box"> 
      <p style="margin: 0; font-size: 14px; color: #856404; line-height: 1.8;">
        <strong>⚠️ Conditions et validité:</strong><br>
        • Ce devis est valable ${settings.quoteValidityDays} jours à compter de la date d'émission (jusqu'au ${validityDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}).<br>
        • Les prix peuvent varier selon les conditions de circulation, les péages et les modifications de trajet.<br>
        • Prix indiqué: ${booking.rateType || 'Tarif standard'}.<br>
        • En cas d'acceptation, une confirmation écrite sera requise.<br>
        • Le paiement est dû à la réception de la facture.
      </p>
    </div>

    ${company.iban || company.bankDetails ? `
    <div class="bank-info">
      <h4>🏦 Informations bancaires</h4>
      <div class="bank-details">
        ${company.iban ? `<strong>IBAN:</strong> ${company.iban}<br>` : ''}
        ${company.bic ? `<strong>BIC:</strong> ${company.bic}<br>` : ''}
        ${company.bankDetails ? `${company.bankDetails}` : ''}
      </div>
    </div>
    ` : ''}

    ${settings.showQRCode && settings.qrCodeData ? `
    <div class="qr-code-section">
      <p style="font-size: 12px; margin-bottom: 10px;">Scannez pour payer ou plus d'infos</p>
      <img src="${settings.qrCodeData}" alt="QR Code" />
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>${company.footerText || company.name}</strong></p>
      <p style="margin-top: 20px; font-size: 10px; line-height: 1.6;">
        TVA non applicable, art. 293 B du CGI<br>
        Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

