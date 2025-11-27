import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICING } from '@/lib/constants';
import { Check, ArrowRight, Sun, Moon } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs - MobiService VTC',
  description: 'Découvrez nos tarifs transparents pour votre transport VTC en Haute-Savoie. Grille tarifaire 2025/2026.',
};

export default function TarifsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-premium-hero text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-grid opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5CD85A]/5 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#5CD85A]/20 mb-6">
            <span className="text-sm font-medium text-white/90">Grille Tarifaire 2025/2026</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Tarifs <span className="text-gradient-emerald">Transparents</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Prix fixes, aucune surprise. Payez exactement ce qui est annoncé lors de la réservation.
          </p>
        </div>
      </section>

      {/* Rate Schedule Info */}
      <section className="py-8 bg-[#FAFAFA] border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sun className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-[#0A0A0A]">Tarif Jour</div>
                <div className="text-sm text-gray-500">7h00 - 20h00 (sauf Dim & JF)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Moon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="font-semibold text-[#0A0A0A]">Tarif Nuit</div>
                <div className="text-sm text-gray-500">20h00 - 7h00 + Dim & JF</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          
          {/* Per KM Rates */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-[#0A0A0A]">Tarifs au kilomètre (TTC)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agglomeration */}
              <Card className="card-premium">
                <CardHeader>
                  <div className="text-3xl mb-2">🏙️</div>
                  <CardTitle>Agglomération</CardTitle>
                  <CardDescription>Jusqu'à 24 km (A/R)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="text-2xl font-bold text-amber-700">{PRICING.perKm.agglomeration.day}€</div>
                        <div className="text-xs text-amber-600">Jour /km</div>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                        <div className="text-2xl font-bold text-indigo-700">{PRICING.perKm.agglomeration.night}€</div>
                        <div className="text-xs text-indigo-600">Nuit /km</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Forfait agglomération avec tarif forfaitaire jusqu'à 24 km maximum.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Hors Agglomeration A/R */}
              <Card className="card-premium">
                <CardHeader>
                  <div className="text-3xl mb-2">🛣️</div>
                  <CardTitle>Hors Agglomération</CardTitle>
                  <CardDescription>À partir de 24 km (A/R)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="text-2xl font-bold text-amber-700">{PRICING.perKm.horsAgglomeration.day}€</div>
                        <div className="text-xs text-amber-600">Jour /km</div>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                        <div className="text-2xl font-bold text-indigo-700">{PRICING.perKm.horsAgglomeration.night}€</div>
                        <div className="text-xs text-indigo-600">Nuit /km</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Tarif appliqué sur base kilométrique (avec client en aller/retour).</p>
                  </div>
                </CardContent>
              </Card>

              {/* Hors Agglomeration One Way */}
              <Card className="card-premium">
                <CardHeader>
                  <div className="text-3xl mb-2">➡️</div>
                  <CardTitle>Aller Simple</CardTitle>
                  <CardDescription>À partir de 12 km</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="text-2xl font-bold text-amber-700">{PRICING.perKm.horsAgglomerationOneWay.day}€</div>
                        <div className="text-xs text-amber-600">Jour /km</div>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                        <div className="text-2xl font-bold text-indigo-700">{PRICING.perKm.horsAgglomerationOneWay.night}€</div>
                        <div className="text-xs text-indigo-600">Nuit /km</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Tarif hors agglomération à partir de 12 km (avec client aller ou retour).</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Forfaits */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-[#0A0A0A]">Forfaits Longue Distance (TTC)</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="p-4 text-left rounded-tl-xl">Forfait</th>
                    <th className="p-4 text-center">Km inclus</th>
                    <th className="p-4 text-center bg-amber-600">Tarif Jour</th>
                    <th className="p-4 text-center bg-indigo-600 rounded-tr-xl">Tarif Nuit</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING.forfaits.map((forfait, index) => (
                    <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                      <td className="p-4 font-semibold">{forfait.label}</td>
                      <td className="p-4 text-center text-gray-600">{forfait.maxKm} km max</td>
                      <td className="p-4 text-center font-bold text-amber-700 bg-amber-50">{forfait.day}€</td>
                      <td className="p-4 text-center font-bold text-indigo-700 bg-indigo-50">{forfait.night}€</td>
                    </tr>
                  ))}
                  <tr className="bg-[#5CD85A]/10 border-2 border-[#5CD85A]">
                    <td className="p-4 font-semibold">Heure supplémentaire</td>
                    <td className="p-4 text-center text-gray-600">Au-delà d'un forfait</td>
                    <td className="p-4 text-center font-bold text-amber-700">{PRICING.extraHour.day}€/h</td>
                    <td className="p-4 text-center font-bold text-indigo-700">{PRICING.extraHour.night}€/h</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * Forfait incluant km avec client et km à vide (départ/retour dépôt). Dim/JF compris dans tarif nuit.
            </p>
          </div>

          {/* Airport & Special */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Airport Geneva */}
            <Card className="card-premium border-2 border-[#5CD85A]">
              <CardHeader>
                <div className="text-4xl mb-2">✈️</div>
                <CardTitle>Aéroport Genève</CardTitle>
                <CardDescription>Transfert depuis Haute-Savoie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">{PRICING.airport.geneva.day}€</div>
                      <div className="text-xs text-amber-600">Jour</div>
                    </div>
                    <div className="text-center p-2 rounded bg-indigo-50">
                      <div className="text-2xl font-bold text-indigo-700">{PRICING.airport.geneva.night}€</div>
                      <div className="text-xs text-indigo-600">Nuit</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Suivi de vol</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Passage frontière inclus</span>
                    </div>
                  </div>
                  <Button className="w-full bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Airport Lyon */}
            <Card className="card-premium">
              <CardHeader>
                <div className="text-4xl mb-2">✈️</div>
                <CardTitle>Aéroport Lyon</CardTitle>
                <CardDescription>Saint-Exupéry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">{PRICING.airport.lyonStExupery.day}€</div>
                      <div className="text-xs text-amber-600">Jour</div>
                    </div>
                    <div className="text-center p-2 rounded bg-indigo-50">
                      <div className="text-2xl font-bold text-indigo-700">{PRICING.airport.lyonStExupery.night}€</div>
                      <div className="text-xs text-indigo-600">Nuit</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Suivi de vol</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Assistance bagages</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hourly */}
            <Card className="card-premium">
              <CardHeader>
                <div className="text-4xl mb-2">⏰</div>
                <CardTitle>Tarif Horaire</CardTitle>
                <CardDescription>Base de facturation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">{PRICING.hourlyBase.day.ttc}€</div>
                      <div className="text-xs text-amber-600">Jour /h</div>
                    </div>
                    <div className="text-center p-2 rounded bg-indigo-50">
                      <div className="text-2xl font-bold text-indigo-700">{PRICING.hourlyBase.night.ttc}€</div>
                      <div className="text-xs text-indigo-600">Nuit /h</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Minimum 2 heures</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Forfaits dès 3h</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/reservation">Réserver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* MDA */}
            <Card className="card-premium">
              <CardHeader>
                <div className="text-4xl mb-2">⏱️</div>
                <CardTitle>Mise à Disposition</CardTitle>
                <CardDescription>Attente sur place</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">{PRICING.mda.dayPerMin}€</div>
                      <div className="text-xs text-amber-600">Jour /min</div>
                    </div>
                    <div className="text-center p-2 rounded bg-indigo-50">
                      <div className="text-2xl font-bold text-indigo-700">{PRICING.mda.nightPerMin}€</div>
                      <div className="text-xs text-indigo-600">Nuit /min</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>10 min gratuites</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5CD85A] mt-0.5" />
                      <span>Facturation à la minute</span>
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
      <section className="py-16 bg-gradient-premium-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à réserver ?</h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Obtenez un prix instantané et réservez votre trajet en quelques clics
          </p>
          <Button size="lg" className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] font-semibold" asChild>
            <Link href="/reservation">
              Réserver maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-white/40 mt-6">
            {PRICING.notes.join(' • ')}
          </p>
        </div>
      </section>
    </div>
  );
}

