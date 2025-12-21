'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, Calendar, MapPin, User, Phone, Euro } from 'lucide-react';
import { DocumentCard } from '@/components/admin/DocumentCard';

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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'facture' | 'devis'>('all');
  const [sending, setSending] = useState<string | null>(null);

  const fetchDocuments = async (type: string = 'all') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/documents?type=${type}`);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(filter);
  }, [filter]);

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
    } catch (error) {
      alert('Erreur lors de l\'envoi');
    } finally {
      setSending(null);
    }
  };

  const handleShare = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Lien copié dans le presse-papier');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      verified: 'bg-blue-100 text-blue-800 border-blue-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <Badge className={`${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
        {status}
      </Badge>
    );
  };

  const renderDocumentCard = (doc: Document | null, bookingId: number, title: string, borderColor: string) => {
    if (!doc) return null;

    const isLoading = sending?.startsWith(`${bookingId}-${doc.type}`);

    return (
      <DocumentCard
        doc={doc}
        bookingId={bookingId}
        title={title}
        borderColor={borderColor}
        isLoading={isLoading}
        onView={handleView}
        onSend={handleSend}
        onShare={handleShare}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] text-white px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">Factures et Devis</h1>
          <p className="text-white/70">Gérez et envoyez vos documents professionnels</p>
        </div>
        
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF88] mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] text-white px-8 py-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Factures et Devis</h1>
            <p className="text-white/70">Gérez et envoyez vos documents professionnels</p>
          </div>
          <Button 
            onClick={() => fetchDocuments(filter)} 
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-8">
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
            >
              Tous <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium">{documents.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="facture"
              className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
            >
              Factures
            </TabsTrigger>
            <TabsTrigger 
              value="devis"
              className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
            >
              Devis
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card className="border-0 shadow-lg p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun document trouvé</h3>
            <p className="text-gray-500">Les documents générés apparaîtront ici</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {documents.map((item) => (
              <Card key={item.bookingId} className="border-0 shadow-lg overflow-hidden">
                {/* Dark Header */}
                <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] text-white px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-[#00FF88]">#{item.bookingId}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{item.guestName}</h3>
                        <p className="text-sm text-white/70">{item.guestEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(item.pickupDate).toLocaleDateString('fr-FR')} à {item.pickupTime}
                        </div>
                        {item.lastGenerated && (
                          <p className="text-xs text-white/50">
                            Généré le {new Date(item.lastGenerated).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Trip Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-[#00FF88] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Trajet</p>
                        <p className="text-sm font-medium text-[#0A0A0A]">
                          {item.pickupAddress} → {item.dropoffAddress}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-[#00FF88] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                        <p className="text-sm font-medium text-[#0A0A0A]">{item.guestPhone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Euro className="h-5 w-5 text-[#00FF88] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Montant</p>
                        <p className="text-lg font-bold text-[#0A0A0A]">
                          {parseFloat(item.totalPrice).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Documents disponibles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderDocumentCard(item.documents.devis, item.bookingId, 'Devis', 'border-blue-500')}
                      {renderDocumentCard(item.documents.facture, item.bookingId, 'Facture', 'border-green-500')}
                      {renderDocumentCard(item.documents.bonCommande, item.bookingId, 'Bon de commande', 'border-purple-500')}
                      {renderDocumentCard(item.documents.bonReservation, item.bookingId, 'Bon de réservation', 'border-amber-500')}
                    </div>
                    
                    {!item.documents.devis && !item.documents.facture && !item.documents.bonCommande && !item.documents.bonReservation && (
                      <div className="text-center py-8 text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun document généré pour cette réservation</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Link */}
                  <div className="pt-4 border-t">
                    <a 
                      href={`/admin/bookings/${item.bookingId}`}
                      className="text-sm text-[#00FF88] hover:text-[#00CC6A] font-medium transition-colors inline-flex items-center gap-2"
                    >
                      Voir la réservation complète
                      <span className="text-lg">→</span>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
