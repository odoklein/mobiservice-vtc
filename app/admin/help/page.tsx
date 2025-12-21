'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HelpCircle,
  BookOpen,
  Settings,
  DollarSign,
  Calendar,
  FileText,
  Search,
  Code,
  AlertCircle,
  Zap,
  Database,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { helpSections, searchHelpContent, getHelpByCategory } from '@/lib/help-content';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'documentation' | 'guide' | 'configuration'>('faq');

  const filteredSections = searchQuery
    ? searchHelpContent(searchQuery)
    : helpSections;

  const faqSections = getHelpByCategory('faq');
  const docSections = getHelpByCategory('documentation');
  const guideSections = getHelpByCategory('guide');
  const configSections = getHelpByCategory('configuration');

  // Group FAQ by topic
  const faqGroups = [
    {
      icon: Calendar,
      title: 'Gestion des réservations',
      items: faqSections.filter(s =>
        s.keywords.includes('réservation') || s.keywords.includes('workflow')
      ),
    },
    {
      icon: DollarSign,
      title: 'Gestion de la tarification',
      items: faqSections.filter(s => s.keywords.includes('tarif')),
    },
    {
      icon: FileText,
      title: 'Factures et Devis',
      items: faqSections.filter(s =>
        s.keywords.includes('facture') || s.keywords.includes('devis')
      ),
    },
    {
      icon: Settings,
      title: 'Paramètres généraux',
      items: faqSections.filter(s =>
        s.keywords.includes('horaires') || s.keywords.includes('dépôt') || s.keywords.includes('mot de passe')
      ),
    },
  ];

  const tabs = [
    { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
    { id: 'documentation' as const, label: 'Documentation', icon: BookOpen },
    { id: 'guide' as const, label: 'Guide PDF', icon: Zap },
    { id: 'configuration' as const, label: 'Configuration', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-sky-500/20">
              <HelpCircle className="h-8 w-8 text-sky-400" />
            </div>
            <h1 className="text-2xl font-bold">Centre d'aide</h1>
          </div>
          <p className="text-slate-400 mb-6">
            Documentation complète et support pour l'administration MobiService VTC
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Quick Links */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Link href="/admin/bookings" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group bg-white">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-sky-50 w-fit mx-auto mb-2">
                    <Calendar className="h-6 w-6 text-sky-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-700">Réservations</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/pricing" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group bg-white">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50 w-fit mx-auto mb-2">
                    <DollarSign className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-700">Tarification</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/invoices" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group bg-white">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-amber-50 w-fit mx-auto mb-2">
                    <FileText className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-700">Factures & Devis</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/working-hours" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group bg-white">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-purple-50 w-fit mx-auto mb-2">
                    <Settings className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-700">Paramètres</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">
              Résultats de recherche ({filteredSections.length})
            </h2>

            {filteredSections.length === 0 ? (
              <Card className="border-0 shadow-md p-8 text-center bg-white">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun résultat trouvé</h3>
                <p className="text-slate-500">Essayez avec d'autres mots-clés</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSections.map((section) => (
                  <Card key={section.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-2">
                        <Badge className="bg-slate-100 text-slate-700">
                          {section.category === 'faq' && 'FAQ'}
                          {section.category === 'documentation' && 'Documentation'}
                          {section.category === 'guide' && 'Guide'}
                          {section.category === 'configuration' && 'Configuration'}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{section.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabbed Content */}
        {!searchQuery && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 bg-white rounded-lg shadow-sm p-1.5 border border-slate-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all
                      ${activeTab === tab.id
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                {faqGroups.map((group, idx) => {
                  const Icon = group.icon;
                  return (
                    <Card key={idx} className="border-0 shadow-md overflow-hidden bg-white">
                      <CardHeader className="border-b border-slate-100 bg-slate-50 py-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="p-1.5 rounded-md bg-sky-100">
                            <Icon className="h-4 w-4 text-sky-600" />
                          </div>
                          {group.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <Accordion type="single" collapsible className="space-y-2">
                          {group.items.map((item) => (
                            <AccordionItem
                              key={item.id}
                              value={item.id}
                              className="border rounded-lg px-4 hover:border-slate-300 transition-colors"
                            >
                              <AccordionTrigger className="text-left font-medium text-slate-800 hover:text-slate-900 hover:no-underline text-sm py-3">
                                {item.title}
                              </AccordionTrigger>
                              <AccordionContent className="text-slate-600 text-sm leading-relaxed pt-1 pb-4">
                                {item.content}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Documentation Tab */}
            {activeTab === 'documentation' && (
              <div className="space-y-4">
                {docSections.map((section) => (
                  <Card key={section.id} className="border-0 shadow-md overflow-hidden bg-white">
                    <CardHeader className="border-b bg-slate-800 text-white py-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Database className="h-4 w-4 text-sky-400" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                        {section.content}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Guide Tab */}
            {activeTab === 'guide' && (
              <div className="space-y-4">
                {guideSections.map((section) => (
                  <Card key={section.id} className="border-0 shadow-md overflow-hidden bg-white">
                    <CardHeader className="border-b bg-blue-600 text-white py-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-4 w-4" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                        {section.content}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Configuration Tab */}
            {activeTab === 'configuration' && (
              <div className="space-y-4">
                {configSections.map((section) => (
                  <Card key={section.id} className="border-0 shadow-md overflow-hidden bg-white">
                    <CardHeader className="border-b bg-purple-600 text-white py-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Code className="h-4 w-4" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                        {section.content}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support Section */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-slate-800 to-slate-900 mt-8">
          <CardContent className="p-6 text-center">
            <div className="p-3 rounded-full bg-sky-500/20 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-sky-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">
              Besoin d'aide supplémentaire ?
            </h3>
            <p className="text-slate-300 mb-5 max-w-xl mx-auto text-sm">
              Si vous ne trouvez pas la réponse à votre question dans notre documentation,
              notre équipe support est là pour vous aider.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation complète
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Badge component
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
