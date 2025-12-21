'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const renderDocumentActions = (doc: Document | null, bookingId: number) => {
    if (!doc) return null;

    return (
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleView(doc.url)}
          className="flex items-center gap-1"
        >
          <span>👁️</span> Voir
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSend(bookingId, doc.type, 'client')}
          disabled={sending === `${bookingId}-${doc.type}-client`}
          className="flex items-center gap-1"
        >
          <span>📧</span> Client
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSend(bookingId, doc.type, 'driver')}
          disabled={sending === `${bookingId}-${doc.type}-driver`}
          className="flex items-center gap-1"
        >
          <span>🚗</span> Chauffeur
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleShare(doc.url)}
          className="flex items-center gap-1"
        >
          <span>🔗</span> Copier
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Factures et Devis</h1>
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Factures et Devis</h1>
        <Button onClick={() => fetchDocuments(filter)} variant="outline">
          🔄 Actualiser
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Tous ({documents.length})</TabsTrigger>
          <TabsTrigger value="facture">Factures</TabsTrigger>
          <TabsTrigger value="devis">Devis</TabsTrigger>
        </TabsList>
      </Tabs>

      {documents.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          Aucun document trouvé
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((item) => (
            <Card key={item.bookingId} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">
                      Réservation #{item.bookingId}
                    </h3>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Client:</strong> {item.guestName}</p>
                    <p><strong>Email:</strong> {item.guestEmail}</p>
                    <p><strong>Téléphone:</strong> {item.guestPhone}</p>
                    <p><strong>Date:</strong> {new Date(item.pickupDate).toLocaleDateString('fr-FR')} à {item.pickupTime}</p>
                    <p><strong>Trajet:</strong> {item.pickupAddress} → {item.dropoffAddress}</p>
                    <p><strong>Montant:</strong> {parseFloat(item.totalPrice).toFixed(2)}€</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Dernière génération: {item.lastGenerated 
                      ? new Date(item.lastGenerated).toLocaleString('fr-FR')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Devis */}
                {item.documents.devis && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      📄 Devis
                    </h4>
                    {renderDocumentActions(item.documents.devis, item.bookingId)}
                  </div>
                )}

                {/* Facture */}
                {item.documents.facture && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                      📄 Facture
                    </h4>
                    {renderDocumentActions(item.documents.facture, item.bookingId)}
                  </div>
                )}

                {/* Bon de commande */}
                {item.documents.bonCommande && (
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                      📄 Bon de commande
                    </h4>
                    {renderDocumentActions(item.documents.bonCommande, item.bookingId)}
                  </div>
                )}

                {/* Bon de réservation */}
                {item.documents.bonReservation && (
                  <div className="border rounded-lg p-4 bg-yellow-50">
                    <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                      📄 Bon de réservation
                    </h4>
                    {renderDocumentActions(item.documents.bonReservation, item.bookingId)}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <a 
                  href={`/admin/bookings/${item.bookingId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  → Voir la réservation complète
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

