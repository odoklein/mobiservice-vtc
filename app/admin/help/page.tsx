'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  HelpCircle,
  Search,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  BookOpen,
  ChevronRight,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { helpSections, searchHelpContent, getHelpByCategory } from '@/lib/help-content';

// Tip of the day - simple, friendly tips
const tips = [
  "💡 Répondez vite aux nouvelles réservations pour satisfaire vos clients !",
  "💡 Vérifiez chaque matin les réservations du jour sur votre tableau de bord.",
  "💡 Pensez à marquer les courses comme 'Terminées' après chaque trajet.",
  "💡 Envoyez les factures directement par email pour gagner du temps.",
  "💡 Configurez vos horaires pour éviter les réservations aux mauvais moments.",
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reservations' | 'documents' | 'tarifs' | 'parametres'>('all');

  // Get today's tip
  const todaysTip = tips[new Date().getDate() % tips.length];

  // Filter sections based on search
  const filteredSections = searchQuery ? searchHelpContent(searchQuery) : helpSections;

  // Category groups for display
  const categories = [
    {
      id: 'reservations',
      label: 'Réservations',
      icon: Calendar,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      keywords: ['réservation', 'confirmer', 'approuver', 'statut', 'couleur']
    },
    {
      id: 'documents',
      label: 'Factures & Devis',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      keywords: ['facture', 'devis', 'document', 'envoyer']
    },
    {
      id: 'tarifs',
      label: 'Tarifs & Prix',
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      keywords: ['tarif', 'prix', 'forfait', 'modifier']
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: Settings,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      keywords: ['horaires', 'dépôt', 'mot de passe', 'paramètres']
    },
  ];

  // Filter by category
  const getFilteredByCategory = () => {
    if (selectedCategory === 'all') return filteredSections;

    const cat = categories.find(c => c.id === selectedCategory);
    if (!cat) return filteredSections;

    return filteredSections.filter(section =>
      cat.keywords.some(keyword =>
        section.keywords.some(k => k.toLowerCase().includes(keyword))
      )
    );
  };

  const displayedSections = getFilteredByCategory();
  const faqSections = displayedSections.filter(s => s.category === 'faq');
  const guideSections = displayedSections.filter(s => s.category === 'guide');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-sky-500/20">
              <HelpCircle className="h-8 w-8 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Besoin d'aide ?</h1>
              <p className="text-slate-400">Trouvez rapidement les réponses à vos questions</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tapez votre question ici..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Tip of the Day */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Astuce du jour</p>
              <p className="text-amber-900">{todaysTip}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions (only show when not searching) */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/bookings" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white h-full">
                <CardContent className="p-4 text-center">
                  <div className="p-3 rounded-xl bg-sky-50 w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">Voir mes réservations</h3>
                  <p className="text-xs text-slate-500 mt-1">Gérer les courses</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/invoices" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white h-full">
                <CardContent className="p-4 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">Factures & Devis</h3>
                  <p className="text-xs text-slate-500 mt-1">Créer des documents</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/pricing" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white h-full">
                <CardContent className="p-4 text-center">
                  <div className="p-3 rounded-xl bg-amber-50 w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <DollarSign className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">Mes tarifs</h3>
                  <p className="text-xs text-slate-500 mt-1">Modifier les prix</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/working-hours" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white h-full">
                <CardContent className="p-4 text-center">
                  <div className="p-3 rounded-xl bg-purple-50 w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">Mes horaires</h3>
                  <p className="text-xs text-slate-500 mt-1">Configurer les jours</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Category Filter (only when not searching) */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedCategory === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              Tout voir
            </button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${selectedCategory === cat.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && filteredSections.length === 0 && (
          <Card className="border-0 shadow-md p-8 text-center bg-white">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun résultat</h3>
            <p className="text-slate-500">Essayez avec d'autres mots</p>
          </Card>
        )}

        {/* Guides Section */}
        {guideSections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-800">Guides pratiques</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {guideSections.map((guide) => (
                <Card key={guide.id} className="border-0 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-sky-500" />
                      {guide.title.replace(/📖 Guide : /, '')}
                    </h3>
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                      {guide.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {faqSections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Questions fréquentes</h2>
            </div>
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              <CardContent className="p-4">
                <Accordion type="single" collapsible className="space-y-2">
                  {faqSections.map((section) => (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="border rounded-lg px-4 hover:border-slate-300 transition-colors"
                    >
                      <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-slate-900 hover:no-underline py-4">
                        <span className="flex items-center gap-2">
                          {section.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-4 whitespace-pre-line">
                        {section.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Support */}
        <Card className="border-0 shadow-md bg-slate-800 text-white">
          <CardContent className="p-6 text-center">
            <div className="p-3 rounded-full bg-sky-500/20 w-fit mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-sky-400" />
            </div>
            <h3 className="font-bold text-xl mb-2">Vous ne trouvez pas la réponse ?</h3>
            <p className="text-slate-300 mb-4">N'hésitez pas à nous contacter, nous sommes là pour vous aider !</p>
            <a
              href="mailto:contact@mobiservice-vtc.fr"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 rounded-lg font-medium transition-colors"
            >
              Nous contacter
              <ChevronRight className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
