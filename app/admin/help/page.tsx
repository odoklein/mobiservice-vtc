'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, BookOpen, Settings, DollarSign, Calendar, FileText, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const sections = [
    {
      icon: Calendar,
      title: 'Gestion des réservations',
      items: [
        {
          question: 'Comment confirmer une réservation ?',
          answer: 'Les réservations sont créées avec le statut "verified" (vérifiée). Vous devez les approuver manuellement depuis la page de détail de la réservation en cliquant sur "Approuver la réservation". Une fois approuvée, elle passe au statut "confirmed" et un email de confirmation est envoyé au client.',
        },
        {
          question: 'Quels sont les statuts possibles ?',
          answer: 'pending (en attente) → verified (vérifiée par email OTP) → confirmed (confirmée par admin) → in_progress (en cours) → completed (terminée) → cancelled (annulée)',
        },
        {
          question: 'Comment modifier une réservation ?',
          answer: 'Depuis la page de détail, cliquez sur "Modifier" pour éditer les informations. Les modifications sont sauvegardées immédiatement.',
        },
        {
          question: 'Comment générer une facture ou un devis ?',
          answer: 'Sur la page de détail de la réservation, utilisez les boutons "Générer facture" ou "Générer devis". Les documents sont créés au format HTML et peuvent être imprimés ou convertis en PDF.',
        },
      ],
    },
    {
      icon: DollarSign,
      title: 'Gestion de la tarification',
      items: [
        {
          question: 'Comment modifier les tarifs ?',
          answer: 'Allez dans Paramètres > Tarification. Vous pouvez modifier tous les tarifs (forfaits, tarifs jour/nuit, aéroports, MDA) via l\'interface à onglets. Les modifications sont immédiates et s\'appliquent aux nouvelles réservations.',
        },
        {
          question: 'Les changements de tarifs affectent-ils les réservations existantes ?',
          answer: 'Non, seules les nouvelles réservations utilisent les nouveaux tarifs. Les réservations existantes conservent leurs prix d\'origine.',
        },
        {
          question: 'Comment réinitialiser les tarifs ?',
          answer: 'Dans la page Tarification, cliquez sur "Réinitialiser" pour restaurer les valeurs par défaut. Attention : cette action remplace tous les tarifs actuels.',
        },
      ],
    },
    {
      icon: FileText,
      title: 'Factures et Devis',
      items: [
        {
          question: 'Comment personnaliser les factures et devis ?',
          answer: 'Allez dans Paramètres > Factures & Devis. Vous pouvez modifier les informations de l\'entreprise, les préfixes de numérotation, la validité des devis, et activer/désactiver l\'affichage des détails de calcul.',
        },
        {
          question: 'Que contiennent les factures détaillées ?',
          answer: 'Les factures détaillées incluent : le détail du calcul (prise en charge, distance, heures supplémentaires, MDA), les segments de distance (CA, TP, Retour), et toutes les informations de trajet.',
        },
        {
          question: 'Où sont stockés les documents générés ?',
          answer: 'Les documents sont sauvegardés dans /public/documents/bookings/ au format HTML. Ils peuvent être ouverts dans un navigateur et imprimés en PDF.',
        },
      ],
    },
    {
      icon: Settings,
      title: 'Paramètres généraux',
      items: [
        {
          question: 'Comment configurer les horaires d\'ouverture ?',
          answer: 'Allez dans Paramètres > Horaires. Configurez les heures d\'ouverture pour chaque jour de la semaine et activez/désactivez les jours selon vos besoins.',
        },
        {
          question: 'Comment modifier l\'adresse du dépôt ?',
          answer: 'Allez dans Paramètres > Dépôt VTC. Modifiez l\'adresse et les coordonnées GPS. Cette adresse est utilisée pour calculer les distances CA et retour.',
        },
        {
          question: 'Comment changer mon mot de passe ?',
          answer: 'Allez dans Paramètres > Mot de passe. Entrez votre ancien mot de passe et le nouveau. Le mot de passe doit contenir au moins 8 caractères.',
        },
      ],
    },
    {
      icon: Users,
      title: 'Workflow de réservation',
      items: [
        {
          question: 'Quel est le processus complet ?',
          answer: '1. Client crée une estimation → 2. Client confirme via email OTP → 3. Réservation passe en "verified" → 4. Admin approuve → 5. Réservation passe en "confirmed" → 6. Email de confirmation envoyé → 7. Service effectué → 8. Statut "completed"',
        },
        {
          question: 'Les réservations sont-elles automatiquement confirmées ?',
          answer: 'Non. Même après vérification par email OTP, les réservations nécessitent une approbation manuelle par l\'administrateur. Cela vous donne un contrôle total sur les réservations acceptées.',
        },
        {
          question: 'Comment voir les réservations en attente d\'approbation ?',
          answer: 'Sur la page Réservations, filtrez par statut "verified" ou utilisez le tableau de bord qui affiche les réservations en attente.',
        },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-[#5CD85A]" />
          Centre d'aide
        </h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Trouvez des réponses à vos questions sur l'utilisation du panneau d'administration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/bookings" className="no-underline">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <Calendar className="h-8 w-8 text-[#5CD85A] mb-3" />
              <h3 className="font-semibold text-lg mb-2">Réservations</h3>
              <p className="text-sm text-gray-600">Gérer et approuver les réservations</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings/pricing" className="no-underline">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 text-[#5CD85A] mb-3" />
              <h3 className="font-semibold text-lg mb-2">Tarification</h3>
              <p className="text-sm text-gray-600">Modifier les tarifs et forfaits</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings/invoices" className="no-underline">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <FileText className="h-8 w-8 text-[#5CD85A] mb-3" />
              <h3 className="font-semibold text-lg mb-2">Factures</h3>
              <p className="text-sm text-gray-600">Personnaliser les documents</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIdx) => {
          const Icon = section.icon;
          return (
            <Card key={sectionIdx} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[#5CD85A]" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="pb-6 border-b last:border-b-0 last:pb-0">
                      <h3 className="font-semibold text-[#0A0A0A] mb-2 flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                        {item.question}
                      </h3>
                      <p className="text-gray-700 text-sm md:text-base ml-7 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-r from-[#5CD85A]/10 to-[#4BC449]/10">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#5CD85A]" />
            Besoin d'aide supplémentaire ?
          </h3>
          <p className="text-gray-700 mb-4">
            Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à consulter la documentation
            ou à contacter le support technique.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-[#5CD85A] text-[#5CD85A] hover:bg-[#5CD85A] hover:text-[#0A0A0A]"
            >
              Documentation complète
            </Button>
            <Button
              variant="outline"
              className="border-[#5CD85A] text-[#5CD85A] hover:bg-[#5CD85A] hover:text-[#0A0A0A]"
            >
              Contacter le support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

