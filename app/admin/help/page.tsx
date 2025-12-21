'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  BookOpen,
  Settings,
  DollarSign,
  Calendar,
  FileText,
  Users,
  ChevronDown,
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
  const [activeTab, setActiveTab] = useState('faq');

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] text-white px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-10 w-10 text-[#00FF88]" />
            <h1 className="text-4xl font-bold">Centre d'aide</h1>
          </div>
          <p className="text-white/70 text-lg mb-6">
            Documentation complète et support pour l'administration MobiService VTC
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher dans l'aide et la documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-[#00FF88]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Links */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <Link href="/admin/bookings" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-[#00FF88] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">Réservations</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/pricing" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 text-[#00FF88] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">Tarification</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/invoices" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 text-[#00FF88] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">Factures</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings/invoices" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-[#00FF88] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">Documents</h3>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings" className="no-underline">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-4 text-center">
                  <Settings className="h-8 w-8 text-[#00FF88] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">Paramètres</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              Résultats de recherche ({filteredSections.length})
            </h2>

            {filteredSections.length === 0 ? (
              <Card className="border-0 shadow-lg p-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-500">Essayez avec d'autres mots-clés</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSections.map((section) => (
                  <Card key={section.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-2">
                        <Badge className="text-xs bg-[#00FF88]/10 text-[#0A0A0A] border-0">
                          {section.category === 'faq' && 'FAQ'}
                          {section.category === 'documentation' && 'Documentation'}
                          {section.category === 'guide' && 'Guide'}
                          {section.category === 'configuration' && 'Configuration'}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg text-[#0A0A0A] mb-2">{section.title}</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabbed Content */}
        {!searchQuery && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white shadow-sm border w-full justify-start">
              <TabsTrigger
                value="faq"
                className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </TabsTrigger>
              <TabsTrigger
                value="documentation"
                className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation
              </TabsTrigger>
              <TabsTrigger
                value="guide"
                className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
              >
                <Zap className="h-4 w-4 mr-2" />
                Guide PDF
              </TabsTrigger>
              <TabsTrigger
                value="configuration"
                className="data-[state=active]:bg-[#00FF88]/10 data-[state=active]:text-[#0A0A0A] data-[state=active]:border-b-2 data-[state=active]:border-[#00FF88]"
              >
                <Code className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
              {faqGroups.map((group, idx) => {
                const Icon = group.icon;
                return (
                  <Card key={idx} className="border-0 shadow-lg">
                    <CardHeader className="border-b bg-gray-50">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Icon className="h-6 w-6 text-[#00FF88]" />
                        {group.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="space-y-2">
                        {group.items.map((item) => (
                          <AccordionItem
                            key={item.id}
                            value={item.id}
                            className="border rounded-lg px-4 hover:border-[#00FF88]/50 transition-colors"
                          >
                            <AccordionTrigger className="text-left font-semibold text-[#0A0A0A] hover:text-[#00FF88] hover:no-underline">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                              {item.content}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-6">
              {docSections.map((section) => (
                <Card key={section.id} className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-[#00FF88]" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
                        {section.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Guide Tab */}
            <TabsContent value="guide" className="space-y-6">
              {guideSections.map((section) => (
                <Card key={section.id} className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
                        {section.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6">
              {configSections.map((section) => (
                <Card key={section.id} className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
                        {section.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Support Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-[#00FF88]/10 to-[#00CC6A]/10 mt-8">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-[#00FF88] mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-3 text-[#0A0A0A]">
              Besoin d'aide supplémentaire ?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Si vous ne trouvez pas la réponse à votre question dans notre documentation,
              notre équipe support est là pour vous aider.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                className="bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0A] font-semibold"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
              <Button
                variant="outline"
                className="border-[#00FF88] text-[#0A0A0A] hover:bg-[#00FF88]/10"
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

// Badge component (inline since it's simple)
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
