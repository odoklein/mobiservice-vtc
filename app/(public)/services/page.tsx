import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SERVICES } from '@/lib/constants';
import { ArrowRight, Check, Star, Shield, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Services - MobiService VTC',
  description: 'Découvrez nos services de transport VTC premium en Haute-Savoie : transferts, aéroport, mise à disposition, événements.',
};

const serviceDetails = {
  transfer: {
    benefits: [
      'Trajet direct sans détour',
      'Prix fixe annoncé à l\'avance',
      'Véhicule premium hybride',
      'Chauffeur professionnel',
    ],
    color: 'bg-blue-500',
  },
  airport: {
    benefits: [
      'Suivi de vol en temps réel',
      'Attente gratuite (30 min)',
      'Assistance bagages',
      'Genève & Lyon Saint-Exupéry',
    ],
    color: 'bg-purple-500',
  },
  hourly: {
    benefits: [
      'Chauffeur à disposition',
      'Itinéraire flexible',
      'Parfait pour les rendez-vous',
      'Facturation transparente',
    ],
    color: 'bg-amber-500',
  },
  business: {
    benefits: [
      'Service haut de gamme',
      'Discrétion absolue',
      'Facturation entreprise',
      'Véhicule executive',
    ],
    color: 'bg-emerald-500',
  },
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-[#0A0A0A] py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-sm font-medium text-[#5CD85A]">Services Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Un service pour chaque
            <span className="text-[#5CD85A]"> besoin</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Du simple transfert aux déplacements professionnels, nous adaptons notre service à vos exigences
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {SERVICES.map((service) => {
              const details = serviceDetails[service.id as keyof typeof serviceDetails];
              return (
                <div
                  key={service.id}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-[#5CD85A]/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${details.color} flex items-center justify-center text-white text-3xl flex-shrink-0`}>
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[#0A0A0A] group-hover:text-[#4BC449] transition-colors">
                        {service.name}
                      </h2>
                      <p className="text-gray-600 mt-1">{service.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {details.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#5CD85A]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-[#5CD85A]" />
                        </div>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div>
                      <span className="text-sm text-gray-500">À partir de</span>
                      <div className="text-xl font-bold text-[#5CD85A]">{service.priceInfo}</div>
                    </div>
                    <Button asChild className="bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white rounded-xl">
                      <Link href="/reservation">
                        Réserver
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0A0A0A] mb-4">
                Pourquoi nous faire confiance
              </h2>
              <p className="text-gray-600">
                Des standards élevés pour chaque trajet
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-[#5CD85A]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">100% Satisfaction</h3>
                <p className="text-sm text-gray-600">Note 5/5 sur tous les trajets</p>
              </div>
              <div className="bg-white p-6 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-[#5CD85A]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Assurance incluse</h3>
                <p className="text-sm text-gray-600">Protection complète pour tous les trajets</p>
              </div>
              <div className="bg-white p-6 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-[#5CD85A]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Ponctualité garantie</h3>
                <p className="text-sm text-gray-600">Nous arrivons toujours à l'heure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Besoin d'un service personnalisé ?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Contactez-nous pour un devis sur mesure
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] h-14 px-8 rounded-xl">
              <Link href="/reservation">
                Réserver maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-xl">
              <Link href="/contact">
                Nous contacter
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
