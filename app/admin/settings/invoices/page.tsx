'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  FileText,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Phone,
  Euro,
  Settings,
  FolderOpen,
  Eye,
  Mail,
  Link2,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================
// INTERFACES
// ============================================

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

interface Document {
  url: string;
  type: string;
  name: string;
}

interface DocumentItem {
  bookingId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  pickupDate: string;
  pickupTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalPrice: string;
  status: string;
  lastGenerated: string;
  documents: {
    devis: Document | null;
    facture: Document | null;
    bonCommande: Document | null;
    bonReservation: Document | null;
  };
}

// ============================================
// STATUS LABELS & STYLES (Senior-Friendly)
// ============================================

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  verified: 'Vérifié',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-300',
  verified: 'bg-blue-50 text-blue-800 border-blue-300',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  completed: 'bg-indigo-50 text-indigo-800 border-indigo-300',
  cancelled: 'bg-red-50 text-red-800 border-red-300',
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function InvoiceSettingsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'documents' | 'settings'>('documents');

  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(true);
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

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'facture' | 'devis'>('all');
  const [sending, setSending] = useState<string | null>(null);

  // ============================================
  // DATA LOADING
  // ============================================

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments(filter);
    }
  }, [filter, activeTab]);

  const loadSettings = async () => {
    setSettingsLoading(true);
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
      setSettingsLoading(false);
    }
  };

  const fetchDocuments = async (type: string = 'all') => {
    setDocumentsLoading(true);
    try {
      const response = await fetch(`/api/admin/documents?type=${type}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // ============================================
  // ACTIONS
  // ============================================

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
        setTimeout(() => setMessage(null), 4000);
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

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSend = async (bookingId: number, type: string, recipient: 'client' | 'driver') => {
    setSending(`${bookingId}-${type}-${recipient}`);
    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/send-document?type=${type}&recipient=${recipient}`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.success) {
        alert(`Document envoyé avec succès à ${data.recipient}`);
      } else {
        alert(data.message);
      }
    } catch {
      alert('Erreur lors de l\'envoi');
    } finally {
      setSending(null);
    }
  };

  const handleShare = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Lien copié dans le presse-papier');
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (settingsLoading && activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============================================ */}
      {/* HEADER - Clean, Large, High Contrast */}
      {/* ============================================ */}
      <div className="bg-slate-900 text-white px-6 md:px-10 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
          Factures & Devis
        </h1>
        <p className="text-slate-300 text-lg">
          Gérez vos documents et paramètres de facturation
        </p>
      </div>

      {/* ============================================ */}
      {/* TAB NAVIGATION - Large, Clear, Easy to Click */}
      {/* ============================================ */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="px-6 md:px-10">
          <nav className="flex gap-2 py-4">
            <button
              onClick={() => setActiveTab('documents')}
              className={`
                flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all
                ${activeTab === 'documents'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
              `}
            >
              <FolderOpen className="h-6 w-6" />
              <span>Mes Documents</span>
              {documents.length > 0 && (
                <span className={`
                  ml-1 px-3 py-1 rounded-full text-sm font-bold
                  ${activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'}
                `}>
                  {documents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`
                flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all
                ${activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
              `}
            >
              <Settings className="h-6 w-6" />
              <span>Paramètres</span>
            </button>
          </nav>
        </div>
      </div>

      {/* ============================================ */}
      {/* DOCUMENTS TAB */}
      {/* ============================================ */}
      {activeTab === 'documents' && (
        <div className="px-6 md:px-10 py-8">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex gap-2">
              {(['all', 'facture', 'devis'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`
                    px-5 py-3 rounded-xl font-semibold text-base transition-all
                    ${filter === filterType
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-400'
                    }
                  `}
                >
                  {filterType === 'all' ? 'Tous les documents' : filterType === 'facture' ? 'Factures' : 'Devis'}
                </button>
              ))}
            </div>

            <Button
              onClick={() => fetchDocuments(filter)}
              size="lg"
              className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold h-12 px-6"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualiser
            </Button>
          </div>

          {/* Documents Loading */}
          {documentsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-slate-500 mx-auto mb-4" />
                <p className="text-lg text-slate-600">Chargement des documents...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            /* Empty State */
            <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
              <CardContent className="py-16 text-center">
                <FileText className="h-20 w-20 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-700 mb-3">
                  Aucun document trouvé
                </h3>
                <p className="text-lg text-slate-500 max-w-md mx-auto">
                  Les factures et devis générés pour vos réservations apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Documents List */
            <div className="space-y-6">
              {documents.map((item) => (
                <Card key={item.bookingId} className="border-0 shadow-lg overflow-hidden bg-white">
                  {/* Document Header - Dark, High Contrast */}
                  <div className="bg-slate-800 text-white px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-bold text-sky-400">
                          #{item.bookingId}
                        </span>
                        <div>
                          <h3 className="font-bold text-xl">{item.guestName}</h3>
                          <p className="text-slate-300 text-base">{item.guestEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-slate-300 text-base mb-1">
                            <Calendar className="h-5 w-5" />
                            {new Date(item.pickupDate).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })} à {item.pickupTime}
                          </div>
                        </div>
                        <Badge className={`${statusStyles[item.status] || 'bg-slate-100 text-slate-800 border-slate-300'} border-2 text-base px-4 py-2 font-semibold`}>
                          {statusLabels[item.status] || item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Document Body */}
                  <CardContent className="p-6 space-y-6">
                    {/* Trip Info - Large, Clear */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b-2 border-slate-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-sky-50">
                          <MapPin className="h-6 w-6 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Trajet</p>
                          <p className="text-base font-semibold text-slate-800">
                            {item.pickupAddress}
                          </p>
                          <p className="text-slate-500 text-base mt-1">→ {item.dropoffAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50">
                          <Phone className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Contact</p>
                          <p className="text-base font-semibold text-slate-800">{item.guestPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-amber-50">
                          <Euro className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Montant Total</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {parseFloat(item.totalPrice).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documents Grid - Large, Clear Actions */}
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide">
                        📄 Documents disponibles
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.documents.devis && (
                          <DocumentCardComponent
                            doc={item.documents.devis}
                            bookingId={item.bookingId}
                            title="Devis"
                            iconColor="text-blue-600"
                            bgColor="bg-blue-50"
                            borderColor="border-blue-300"
                            isLoading={sending?.startsWith(`${item.bookingId}-${item.documents.devis.type}`)}
                            onView={handleView}
                            onSend={handleSend}
                            onShare={handleShare}
                          />
                        )}
                        {item.documents.facture && (
                          <DocumentCardComponent
                            doc={item.documents.facture}
                            bookingId={item.bookingId}
                            title="Facture"
                            iconColor="text-emerald-600"
                            bgColor="bg-emerald-50"
                            borderColor="border-emerald-300"
                            isLoading={sending?.startsWith(`${item.bookingId}-${item.documents.facture.type}`)}
                            onView={handleView}
                            onSend={handleSend}
                            onShare={handleShare}
                          />
                        )}
                        {item.documents.bonCommande && (
                          <DocumentCardComponent
                            doc={item.documents.bonCommande}
                            bookingId={item.bookingId}
                            title="Bon de commande"
                            iconColor="text-purple-600"
                            bgColor="bg-purple-50"
                            borderColor="border-purple-300"
                            isLoading={sending?.startsWith(`${item.bookingId}-${item.documents.bonCommande.type}`)}
                            onView={handleView}
                            onSend={handleSend}
                            onShare={handleShare}
                          />
                        )}
                        {item.documents.bonReservation && (
                          <DocumentCardComponent
                            doc={item.documents.bonReservation}
                            bookingId={item.bookingId}
                            title="Bon de réservation"
                            iconColor="text-amber-600"
                            bgColor="bg-amber-50"
                            borderColor="border-amber-300"
                            isLoading={sending?.startsWith(`${item.bookingId}-${item.documents.bonReservation.type}`)}
                            onView={handleView}
                            onSend={handleSend}
                            onShare={handleShare}
                          />
                        )}
                      </div>

                      {!item.documents.devis && !item.documents.facture && !item.documents.bonCommande && !item.documents.bonReservation && (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                          <FileText className="h-14 w-14 mx-auto mb-3 text-slate-300" />
                          <p className="text-lg text-slate-500 font-medium">
                            Aucun document généré pour cette réservation
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Link */}
                    <div className="pt-4 border-t-2 border-slate-100">
                      <a
                        href={`/admin/bookings/${item.bookingId}`}
                        className="inline-flex items-center gap-2 text-lg text-slate-700 hover:text-slate-900 font-semibold transition-colors group"
                      >
                        Voir la réservation complète
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* SETTINGS TAB */}
      {/* ============================================ */}
      {activeTab === 'settings' && (
        <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto space-y-8">
          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-5 rounded-xl flex items-start gap-4 ${message.type === 'success'
                  ? 'bg-emerald-50 border-2 border-emerald-300'
                  : 'bg-red-50 border-2 border-red-300'
                }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-7 w-7 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-7 w-7 text-red-600 flex-shrink-0" />
              )}
              <p className={`font-semibold text-lg ${message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Company Information Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-800 text-white py-5 px-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Building2 className="h-7 w-7" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold text-slate-700 mb-2 block">
                    Nom de l'entreprise *
                  </Label>
                  <Input
                    id="name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-base font-semibold text-slate-700 mb-2 block">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-base font-semibold text-slate-700 mb-2 block">
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-base font-semibold text-slate-700 mb-2 block">
                    Ville
                  </Label>
                  <Input
                    id="city"
                    value={companySettings.city}
                    onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-base font-semibold text-slate-700 mb-2 block">
                    Code postal
                  </Label>
                  <Input
                    id="postalCode"
                    value={companySettings.postalCode}
                    onChange={(e) => setCompanySettings({ ...companySettings, postalCode: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-semibold text-slate-700 mb-2 block">
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="siret" className="text-base font-semibold text-slate-700 mb-2 block">
                    SIRET
                  </Label>
                  <Input
                    id="siret"
                    value={companySettings.siret}
                    onChange={(e) => setCompanySettings({ ...companySettings, siret: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="tva" className="text-base font-semibold text-slate-700 mb-2 block">
                    N° TVA
                  </Label>
                  <Input
                    id="tva"
                    value={companySettings.tva}
                    onChange={(e) => setCompanySettings({ ...companySettings, tva: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-base font-semibold text-slate-700 mb-2 block">
                    Site web
                  </Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bankDetails" className="text-base font-semibold text-slate-700 mb-2 block">
                  Coordonnées bancaires
                </Label>
                <Textarea
                  id="bankDetails"
                  value={companySettings.bankDetails}
                  onChange={(e) => setCompanySettings({ ...companySettings, bankDetails: e.target.value })}
                  className="min-h-[120px] text-lg border-2 border-slate-200 focus:border-slate-500"
                  placeholder="IBAN, BIC, etc."
                />
              </div>

              <div>
                <Label htmlFor="paymentTerms" className="text-base font-semibold text-slate-700 mb-2 block">
                  Conditions de paiement
                </Label>
                <Input
                  id="paymentTerms"
                  value={companySettings.paymentTerms}
                  onChange={(e) => setCompanySettings({ ...companySettings, paymentTerms: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="footerText" className="text-base font-semibold text-slate-700 mb-2 block">
                  Texte de pied de page
                </Label>
                <Input
                  id="footerText"
                  value={companySettings.footerText}
                  onChange={(e) => setCompanySettings({ ...companySettings, footerText: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Settings Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-800 text-white py-5 px-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <FileText className="h-7 w-7" />
                Paramètres des documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="invoicePrefix" className="text-base font-semibold text-slate-700 mb-2 block">
                    Préfixe facture
                  </Label>
                  <Input
                    id="invoicePrefix"
                    value={invoiceSettings.invoicePrefix}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                    placeholder="INV"
                  />
                </div>
                <div>
                  <Label htmlFor="quotePrefix" className="text-base font-semibold text-slate-700 mb-2 block">
                    Préfixe devis
                  </Label>
                  <Input
                    id="quotePrefix"
                    value={invoiceSettings.quotePrefix}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, quotePrefix: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                    placeholder="DEV"
                  />
                </div>
                <div>
                  <Label htmlFor="quoteValidityDays" className="text-base font-semibold text-slate-700 mb-2 block">
                    Validité devis (jours)
                  </Label>
                  <Input
                    id="quoteValidityDays"
                    type="number"
                    value={invoiceSettings.quoteValidityDays}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, quoteValidityDays: parseInt(e.target.value) || 30 })}
                    className="h-14 text-lg border-2 border-slate-200 focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t-2 border-slate-100">
                <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    id="showDetailedBreakdown"
                    checked={invoiceSettings.showDetailedBreakdown}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showDetailedBreakdown: e.target.checked })}
                    className="w-6 h-6 rounded border-2 border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <span className="text-lg text-slate-700 font-medium">
                    Afficher le détail du calcul (tarif de base, distance, etc.)
                  </span>
                </label>

                <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    id="showDistanceSegments"
                    checked={invoiceSettings.showDistanceSegments}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showDistanceSegments: e.target.checked })}
                    className="w-6 h-6 rounded border-2 border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <span className="text-lg text-slate-700 font-medium">
                    Afficher les segments de distance (Course A, Trajet Principal, Retour)
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Save Button - Large and Clear */}
          <div className="flex justify-end pb-8">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="h-16 px-10 bg-slate-800 hover:bg-slate-900 text-white font-bold text-lg shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-6 w-6 mr-3" />
                  Enregistrer les paramètres
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DOCUMENT CARD COMPONENT (Senior-Friendly)
// ============================================

interface DocumentCardComponentProps {
  doc: Document;
  bookingId: number;
  title: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  isLoading?: boolean;
  onView: (url: string) => void;
  onSend: (bookingId: number, type: string, recipient: 'client' | 'driver') => void;
  onShare: (url: string) => void;
}

function DocumentCardComponent({
  doc,
  bookingId,
  title,
  iconColor,
  bgColor,
  borderColor,
  isLoading = false,
  onView,
  onSend,
  onShare,
}: DocumentCardComponentProps) {
  return (
    <div className={`relative border-l-4 ${borderColor} bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <FileText className={`h-6 w-6 ${iconColor}`} />
        </div>
        <h4 className="font-bold text-xl text-slate-800">{title}</h4>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          onClick={() => onView(doc.url)}
          className="flex-1 min-w-[120px] h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base border-2 border-slate-200"
        >
          <Eye className="h-5 w-5 mr-2" />
          Voir
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              disabled={isLoading}
              className="flex-1 min-w-[120px] h-14 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-base"
            >
              <Mail className="h-5 w-5 mr-2" />
              {isLoading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => onSend(bookingId, doc.type, 'client')}
              className="py-4 text-base cursor-pointer"
            >
              <User className="h-5 w-5 mr-3" />
              Envoyer au client
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSend(bookingId, doc.type, 'driver')}
              className="py-4 text-base cursor-pointer"
            >
              <Phone className="h-5 w-5 mr-3" />
              Envoyer au chauffeur
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="lg"
          onClick={() => onShare(doc.url)}
          className="h-14 px-5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border-2 border-slate-200"
        >
          <Link2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
