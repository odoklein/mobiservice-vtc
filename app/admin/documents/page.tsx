'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  IconFileText,
  IconDownload,
  IconEye,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconFileInvoice,
  IconReceipt,
  IconLoader2,
} from '@tabler/icons-react';

interface Document {
  id: number;
  bookingId: number;
  type: 'invoice' | 'order' | 'estimate';
  filename: string;
  url: string;
  createdAt: string;
  clientName?: string;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'invoice' | 'order' | 'estimate'>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <IconFileInvoice className="h-5 w-5 text-blue-500" />;
      case 'order':
        return <IconReceipt className="h-5 w-5 text-green-500" />;
      case 'estimate':
        return <IconFileText className="h-5 w-5 text-orange-500" />;
      default:
        return <IconFileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Facture';
      case 'order':
        return 'Bon de commande';
      case 'estimate':
        return 'Devis';
      default:
        return type;
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.bookingId.toString().includes(searchTerm);
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">
            Gérez les factures, bons de commande et devis
          </p>
        </div>
        <Button onClick={fetchDocuments} variant="outline" className="gap-2">
          <IconRefresh className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, fichier ou n° réservation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                Tous
              </Button>
              <Button
                variant={filterType === 'invoice' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('invoice')}
              >
                Factures
              </Button>
              <Button
                variant={filterType === 'order' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('order')}
              >
                Bons de commande
              </Button>
              <Button
                variant={filterType === 'estimate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('estimate')}
              >
                Devis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Liste des documents
            <Badge variant="secondary" className="ml-2">
              {filteredDocuments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <IconFileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun document trouvé</p>
              {searchTerm || filterType !== 'all' ? (
                <p className="text-sm text-gray-400 mt-1">
                  Essayez de modifier vos filtres
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-1">
                  Les documents apparaîtront ici une fois générés
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {doc.filename}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(doc.type)}
                        </Badge>
                        <span>•</span>
                        <span>Réservation #{doc.bookingId}</span>
                        {doc.clientName && (
                          <>
                            <span>•</span>
                            <span>{doc.clientName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 mr-4">
                      {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <IconEye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} download={doc.filename}>
                        <IconDownload className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
