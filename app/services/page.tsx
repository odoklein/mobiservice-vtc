import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SERVICES } from '@/lib/constants';
import { ArrowRight, Check } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Services - MobiService VTC',
  description: 'Découvrez nos services de transport VTC premium à Lyon : transferts, aéroport, mise à disposition, événements.',
};

const serviceDetails = {
  transfer: {
    benefits: [
      'Trajet direct sans détour',
      'Prix calculé à l\'avance',
      'Véhicule premium tout confort',
      'Chauffeur professionnel',
      'Paiement sécurisé en ligne',
    ],
    useCases: [
      'Rendez-vous médical',
      'Rendez-vous professionnel',
      'Shopping',
      'Soirée entre amis',
      'Tout déplacement en ville',
    ],
  },
  airport: {
    benefits: [
      'Prise en charge à l\'heure exacte',
      'Suivi de vol en temps réel',
      'Assistance bagages',
      'Panneau d\'accueil personnalisé',
      'Parking gratuit inclus',
    ],
    useCases: [
      'Aéroport Lyon Saint-Exupéry',
      'Aéroport de Genève',
      'Gare de Lyon Part-Dieu',
      'Gare de Lyon Perrache',
      'Transferts inter-gares',
    ],
  },
  hourly: {
    benefits: [
      'Chauffeur à votre disposition',
      'Déplacements multiples',
      'Flexibilité totale',
      'Tarif horaire avantageux',
      'Minimum 2 heures',
    ],
    useCases: [
      'Tournée professionnelle',
      'Visite de la ville',
      'Shopping multi-boutiques',
      'Événement d\'entreprise',
      'Journée VIP',
    ],
  },
  business: {
    benefits: [
      'Service haut de gamme',
      'Discrétion absolue',
      'Facturation entreprise',
      'Réservation pour tiers',
      'Disponibilité étendue',
    ],
    useCases: [
      'Réunion d\'affaires',
      'Séminaire',
      'Conférence',
      'Mariage',
      'Événement privé',
    ],
  },
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Nos Services</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Un service adapté à chaque besoin de transport, toujours avec le même niveau d'excellence
          </p>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-20">
            {SERVICES.map((service, index) => {
              const details = serviceDetails[service.id as keyof typeof serviceDetails];
              return (
                <div
                  key={service.id}
                  id={service.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="text-5xl mb-4">{service.icon}</div>
                    <h2 className="text-3xl font-bold mb-4">{service.name}</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {service.description}
                    </p>
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg inline-block mb-8">
                      <span className="font-semibold">{service.priceInfo}</span>
                    </div>
                    <div className="flex gap-4">
                      <Button asChild>
                        <Link href="/reservation">
                          Réserver
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/tarifs">Voir les tarifs</Link>
                      </Button>
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Avantages</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {details.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Cas d'usage</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {details.useCases.map((useCase, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span className="text-sm">{useCase}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'un service personnalisé ?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contactez-nous pour un devis adapté à vos besoins spécifiques
          </p>
          <Button asChild size="lg">
            <Link href="/contact">
              Nous contacter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

