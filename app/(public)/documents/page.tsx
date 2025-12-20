import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Documents | MobiService VTC',
  description: 'Consultez notre grille tarifaire pour les services de transport VTC MobiService.',
};

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold text-[#0A0A0A] mb-2">Documents</h1>
          <p className="text-gray-600">
            Consultez notre grille tarifaire
          </p>
        </div>

        {/* Grille tarifaire */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00FF88]" />
              Grille tarifaire 2025-2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Consultez notre grille tarifaire complète pour tous nos services de transport VTC.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <iframe
                  src="/docs/grille-tarifaire-2025-2026.pdf"
                  className="w-full h-[800px] border-0 rounded"
                  title="Grille tarifaire 2025-2026"
                />
              </div>
              <div className="flex gap-4">
                <a
                  href="/docs/grille-tarifaire-2025-2026.pdf"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF88] hover:bg-[#00CC6A] text-black rounded-md font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Télécharger la grille tarifaire (PDF)
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to CGV */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#00FF88]" />
                <div>
                  <h3 className="font-semibold text-[#0A0A0A]">Conditions Générales de Vente</h3>
                  <p className="text-sm text-gray-500">Consultez nos CGV complètes</p>
                </div>
              </div>
              <Link href="/cgv">
                <Button variant="outline" className="border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88]/10">
                  Voir les CGV
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/reservation">
            <Button className="bg-[#00FF88] hover:bg-[#00CC6A] text-black">
              Faire une réservation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


