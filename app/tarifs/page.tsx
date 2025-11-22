import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICING, SERVICES } from '@/lib/constants';
import { Check, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs - MobiService VTC',
  description: 'Découvrez nos tarifs transparents pour votre transport VTC à Lyon. Prix fixes, pas de surprises.',
};

export default function TarifsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMyLjIwOSAwIDQtMS43OTEgNC00cy0xLjc5MS00LTQtNC00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Tarifs Transparents</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Prix fixes, aucune surprise. Payez exactement ce qui est annoncé lors de la réservation.
          </p>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Transfer */}
            <Card className="border-2">
              <CardHeader>
                <div className="text-4xl mb-2">🚗</div>
                <CardTitle>Transfert</CardTitle>
                <CardDescription>Point à point</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">{PRICING.transfer.perKm}€</div>
                    <div className="text-sm text-muted-foreground">par kilomètre</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Base : {PRICING.transfer.baseFare}€</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Minimum : {PRICING.transfer.minPrice}€</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Prix fixe à la réservation</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Airport Lyon */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="text-4xl mb-2">✈️</div>
                <CardTitle>Aéroport Lyon</CardTitle>
                <CardDescription>Saint-Exupéry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">{PRICING.airport.lyonStExupery}€</div>
                    <div className="text-sm text-muted-foreground">forfait</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Suivi de vol</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Assistance bagages</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Panneau personnalisé</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Airport Geneva */}
            <Card className="border-2">
              <CardHeader>
                <div className="text-4xl mb-2">✈️</div>
                <CardTitle>Aéroport Genève</CardTitle>
                <CardDescription>Transfert international</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">{PRICING.airport.geneva}€</div>
                    <div className="text-sm text-muted-foreground">forfait</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Suivi de vol</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Assistance bagages</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Passage frontière inclus</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hourly */}
            <Card className="border-2">
              <CardHeader>
                <div className="text-4xl mb-2">⏰</div>
                <CardTitle>Mise à Disposition</CardTitle>
                <CardDescription>Tarif horaire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">{PRICING.hourly.perHour}€</div>
                    <div className="text-sm text-muted-foreground">par heure</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Minimum {PRICING.hourly.minHours}h</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Déplacements illimités</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Flexibilité maximale</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What's Included */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">Inclus dans tous nos tarifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Confort Premium</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Véhicule Mercedes-Benz hybride</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Climatisation</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>WiFi à bord</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Chargeurs USB</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">Service</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Chauffeur professionnel</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Ponctualité garantie</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Discrétion absolue</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Bouteilles d'eau offertes</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">Sécurité</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Assurance premium</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Véhicule entretenu</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Paiement sécurisé</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Licence VTC valide</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Questions fréquentes</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comment est calculé le prix ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Le prix est calculé en fonction de la distance, du type de service et des éventuels suppléments. 
                    Le prix final est affiché avant la réservation et ne change pas.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puis-je annuler ma réservation ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oui, vous pouvez annuler gratuitement jusqu'à 24h avant le trajet. 
                    Pour les annulations tardives, des frais peuvent s'appliquer.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acceptez-vous les paiements en espèces ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Le paiement en ligne par carte bancaire est privilégié pour votre sécurité. 
                    Le paiement en espèces peut être accepté sur demande préalable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à réserver ?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Obtenez un prix instantané et réservez votre trajet en quelques clics
          </p>
          <Button size="lg" asChild>
            <Link href="/reservation">
              Réserver maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

