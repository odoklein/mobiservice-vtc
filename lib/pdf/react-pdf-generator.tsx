import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Booking } from '@/lib/db/schema';

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#00FF88',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  documentNumber: {
    fontSize: 16,
    color: '#00FF88',
    fontWeight: 'bold',
  },
  companyInfo: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'right',
    lineHeight: 1.5,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    width: '48%',
  },
  infoLine: {
    marginBottom: 8,
    fontSize: 10,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#000000',
  },
  clientSection: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88',
    marginBottom: 20,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    padding: 12,
  },
  tableCol1: { width: '50%' },
  tableCol2: { width: '15%', textAlign: 'right' },
  tableCol3: { width: '17.5%', textAlign: 'right' },
  tableCol4: { width: '17.5%', textAlign: 'right' },
  itemDescription: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 11,
  },
  itemDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  totalsSection: {
    marginLeft: 'auto',
    width: '50%',
    marginTop: 20,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalAmount: {
    color: '#00FF88',
  },
  footer: {
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#eeeeee',
    textAlign: 'center',
    fontSize: 9,
    color: '#999999',
  },
  validityBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 20,
  },
  validityText: {
    fontSize: 10,
    color: '#856404',
    lineHeight: 1.6,
  },
  bankInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88',
    borderRadius: 8,
    marginTop: 20,
  },
});

interface PDFDocumentProps {
  type: 'facture' | 'devis' | 'bon' | 'bdr';
  booking: Booking;
  company: any;
  invoice: any;
}

export const InvoicePDF: React.FC<PDFDocumentProps> = ({ type, booking, company, invoice }) => {
  const isDevis = type === 'devis';
  const prefix = isDevis ? (invoice.quotePrefix || 'DEV') : (invoice.invoicePrefix || 'INV');
  const documentNumber = `${prefix}-${new Date().getFullYear()}-${booking.id.toString().padStart(6, '0')}`;
  const documentTitle = isDevis ? 'DEVIS' : type === 'bon' ? 'BON DE COMMANDE' : type === 'bdr' ? 'BON DE RÉSERVATION' : 'FACTURE';

  const totalHT = parseFloat(booking.totalPriceHT?.toString() || booking.basePrice?.toString() || '0');
  const tva = parseFloat(booking.tvaAmount?.toString() || '0');
  const totalTTC = parseFloat(booking.totalPriceTTC?.toString() || booking.totalPrice?.toString() || '0');

  const validityDate = new Date();
  if (isDevis) {
    validityDate.setDate(validityDate.getDate() + (invoice.quoteValidityDays || 30));
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{documentTitle}</Text>
            <Text style={styles.documentNumber}>{documentNumber}</Text>
          </View>
          <View>
            <Text style={styles.companyName}>{company.name || 'MobiService VTC'}</Text>
            <Text style={styles.companyInfo}>
              {company.address || '4 rue des artisans'}{'\n'}
              {company.postalCode || '74300'} {company.city || 'Cluses'}, France{'\n'}
              {company.phone && `Tél: ${company.phone}\n`}
              {company.email && `Email: ${company.email}\n`}
              {company.website && `Web: ${company.website}\n`}
              {'\n'}
              SIRET: {company.siret || 'XXX XXX XXX XXXXX'}{'\n'}
              TVA: {company.tva || 'FRXX XXX XXX XXX'}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Date d'émission: </Text>
              {new Date().toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Date de service: </Text>
              {new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à {booking.pickupTime}
            </Text>
            {isDevis && (
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Validité: </Text>
                {invoice.quoteValidityDays || 30} jours
              </Text>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Type de service: </Text>
              {booking.serviceType}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Type de trajet: </Text>
              {booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Tarif appliqué: </Text>
              {booking.rateType || 'Standard'}
            </Text>
          </View>
        </View>

        {/* Client Section */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>{isDevis ? 'Client:' : 'Facturation à:'}</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.6 }}>
            <Text style={{ fontWeight: 'bold' }}>{booking.guestName || 'Client'}</Text>{'\n'}
            {booking.guestEmail}{'\n'}
            {booking.guestPhone}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Description</Text>
            <Text style={styles.tableCol2}>Qté</Text>
            <Text style={styles.tableCol3}>Prix unit. HT</Text>
            <Text style={styles.tableCol4}>Montant HT</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol1}>
              <Text style={styles.itemDescription}>
                Service VTC {booking.serviceType} - {booking.tripType === 'round-trip' ? 'A/R' : 'A/S'}
              </Text>
              <Text style={styles.itemDetails}>
                De {booking.pickupAddress}{'\n'}
                à {booking.dropoffAddress}{'\n'}
                {booking.passengers} passagers | {booking.luggage} bagages
                {booking.distanceTP && `\nDistance: ${booking.distanceTP} km`}
              </Text>
            </View>
            <Text style={styles.tableCol2}>1</Text>
            <Text style={styles.tableCol3}>{totalHT.toFixed(2)}€</Text>
            <Text style={styles.tableCol4}>{totalHT.toFixed(2)}€</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalLine}>
            <Text>Sous-total HT</Text>
            <Text>{totalHT.toFixed(2)}€</Text>
          </View>
          <View style={styles.totalLine}>
            <Text>TVA (10%)</Text>
            <Text>{tva.toFixed(2)}€</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text>Total TTC</Text>
            <Text style={styles.totalAmount}>{totalTTC.toFixed(2)}€</Text>
          </View>
        </View>

        {/* Validity Box for Devis */}
        {isDevis && (
          <View style={styles.validityBox}>
            <Text style={styles.validityText}>
              ⚠️ Conditions et validité:{'\n'}
              • Ce devis est valable {invoice.quoteValidityDays || 30} jours{'\n'}
              • Prix indiqué: {booking.rateType || 'Standard'}{'\n'}
              • En cas d'acceptation, une confirmation écrite sera requise
            </Text>
          </View>
        )}

        {/* Bank Info if available */}
        {(company.iban || company.bankDetails) && (
          <View style={styles.bankInfo}>
            <Text style={styles.sectionTitle}>Informations bancaires</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.6 }}>
              {company.iban && `IBAN: ${company.iban}\n`}
              {company.bic && `BIC: ${company.bic}\n`}
              {company.bankDetails}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontWeight: 'bold', color: '#000000', marginBottom: 5 }}>
            {company.footerText || company.name || 'MobiService VTC'}
          </Text>
          <Text>Merci de votre confiance</Text>
          <Text style={{ marginTop: 10, fontSize: 8 }}>
            TVA non applicable, art. 293 B du CGI{'\n'}
            Document généré le {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};


