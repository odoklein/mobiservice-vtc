'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  siret: string;
  tva: string;
  phone: string;
  email: string;
  website: string;
  bankDetails: string;
  paymentTerms: string;
  footerText: string;
}

interface InvoiceSettings {
  invoicePrefix: string;
  quotePrefix: string;
  quoteValidityDays: number;
  showDetailedBreakdown: boolean;
  showDistanceSegments: boolean;
}

export default function InvoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'MobiService VTC',
    address: '4 rue des artisans',
    city: 'Cluses',
    postalCode: '74300',
    siret: 'XXX XXX XXX XXXXX',
    tva: 'FRXX XXX XXX XXX',
    phone: '+33 (0)6 07 72 50 07',
    email: 'contact@mobiservice-vtc.fr',
    website: 'www.mobiservice-vtc.fr',
    bankDetails: '',
    paymentTerms: 'Paiement à réception de facture',
    footerText: 'MobiService VTC - Transport premium en Haute-Savoie',
  });

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoicePrefix: 'INV',
    quotePrefix: 'DEV',
    quoteValidityDays: 30,
    showDetailedBreakdown: true,
    showDistanceSegments: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/invoices');
      if (response.ok) {
        const data = await response.json();
        if (data.companySettings) setCompanySettings(data.companySettings);
        if (data.invoiceSettings) setInvoiceSettings(data.invoiceSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySettings,
          invoiceSettings,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5CD85A]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0A0A0A]">Paramètres Factures & Devis</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">Configurez les informations de votre entreprise et les paramètres des documents</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`font-medium text-sm ${
              message.type === 'success' ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Company Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#5CD85A]" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom de l'entreprise *</Label>
              <Input
                id="name"
                value={companySettings.name}
                onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={companySettings.city}
                onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={companySettings.postalCode}
                onChange={(e) => setCompanySettings({ ...companySettings, postalCode: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={companySettings.phone}
                onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={companySettings.siret}
                onChange={(e) => setCompanySettings({ ...companySettings, siret: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tva">N° TVA</Label>
              <Input
                id="tva"
                value={companySettings.tva}
                onChange={(e) => setCompanySettings({ ...companySettings, tva: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                value={companySettings.website}
                onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                className="h-10 mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bankDetails">Coordonnées bancaires</Label>
            <Textarea
              id="bankDetails"
              value={companySettings.bankDetails}
              onChange={(e) => setCompanySettings({ ...companySettings, bankDetails: e.target.value })}
              className="mt-1 min-h-[80px]"
              placeholder="IBAN, BIC, etc."
            />
          </div>
          <div>
            <Label htmlFor="paymentTerms">Conditions de paiement</Label>
            <Input
              id="paymentTerms"
              value={companySettings.paymentTerms}
              onChange={(e) => setCompanySettings({ ...companySettings, paymentTerms: e.target.value })}
              className="h-10 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="footerText">Texte de pied de page</Label>
            <Input
              id="footerText"
              value={companySettings.footerText}
              onChange={(e) => setCompanySettings({ ...companySettings, footerText: e.target.value })}
              className="h-10 mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#5CD85A]" />
            Paramètres des documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoicePrefix">Préfixe facture</Label>
              <Input
                id="invoicePrefix"
                value={invoiceSettings.invoicePrefix}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })}
                className="h-10 mt-1"
                placeholder="INV"
              />
            </div>
            <div>
              <Label htmlFor="quotePrefix">Préfixe devis</Label>
              <Input
                id="quotePrefix"
                value={invoiceSettings.quotePrefix}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, quotePrefix: e.target.value })}
                className="h-10 mt-1"
                placeholder="DEV"
              />
            </div>
            <div>
              <Label htmlFor="quoteValidityDays">Validité devis (jours)</Label>
              <Input
                id="quoteValidityDays"
                type="number"
                value={invoiceSettings.quoteValidityDays}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, quoteValidityDays: parseInt(e.target.value) || 30 })}
                className="h-10 mt-1"
              />
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showDetailedBreakdown"
                checked={invoiceSettings.showDetailedBreakdown}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showDetailedBreakdown: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#5CD85A] focus:ring-[#5CD85A]"
              />
              <Label htmlFor="showDetailedBreakdown" className="font-normal cursor-pointer">
                Afficher le détail du calcul (baseFare, distanceCharge, etc.)
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showDistanceSegments"
                checked={invoiceSettings.showDistanceSegments}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showDistanceSegments: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#5CD85A] focus:ring-[#5CD85A]"
              />
              <Label htmlFor="showDistanceSegments" className="font-normal cursor-pointer">
                Afficher les segments de distance (CA, TP, Retour)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-6 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] font-semibold"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </Button>
      </div>
    </div>
  );
}

