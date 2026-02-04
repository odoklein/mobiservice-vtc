import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VTC_DEPOT } from '@/lib/constants';
import { ArrowRight, MapPin, Info, CheckCircle2, Sun, Moon, Clock, Download, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs VTC 2026 - MobiService',
  description: 'Grille tarifaire transparente pour vos trajets VTC en Haute-Savoie. Forfaits agglomération, tarifs au km, mise à disposition.',
};

// Forfaits MDA complets selon grille 2026 (1H à 8H)
const FORFAITS_MDA = [
  { hours: '1H', km: 90, dayHT: 105.45, dayTTC: 116, nightHT: 127.27, nightTTC: 140, hourlyDay: 116, hourlyNight: 140 },
  { hours: '1H30', km: 135, dayHT: 158.18, dayTTC: 174, nightHT: 190.91, nightTTC: 210, hourlyDay: 116, hourlyNight: 140 },
  { hours: '2H', km: 180, dayHT: 210.91, dayTTC: 232, nightHT: 254.55, nightTTC: 280, hourlyDay: 116, hourlyNight: 140 },
  { hours: '2H30', km: 225, dayHT: 263.64, dayTTC: 290, nightHT: 306.82, nightTTC: 337.50, hourlyDay: 116, hourlyNight: 135 },
  { hours: '3H', km: 270, dayHT: 316.36, dayTTC: 348, nightHT: 354.55, nightTTC: 390, hourlyDay: 116, hourlyNight: 130 },
  { hours: '3H30', km: 315, dayHT: 369.09, dayTTC: 406, nightHT: 413.64, nightTTC: 455, hourlyDay: 116, hourlyNight: 130 },
  { hours: '4H', km: 360, dayHT: 421.82, dayTTC: 464, nightHT: 472.73, nightTTC: 520, hourlyDay: 116, hourlyNight: 130 },
  { hours: '4H30', km: 405, dayHT: 474.55, dayTTC: 522, nightHT: 531.82, nightTTC: 585, hourlyDay: 116, hourlyNight: 130 },
  { hours: '5H', km: 450, dayHT: 527.27, dayTTC: 580, nightHT: 590.91, nightTTC: 650, hourlyDay: 116, hourlyNight: 130 },
  { hours: '5H30', km: 495, dayHT: 580.00, dayTTC: 638, nightHT: 650.00, nightTTC: 715, hourlyDay: 116, hourlyNight: 130 },
  { hours: '6H', km: 540, dayHT: 600.00, dayTTC: 660, nightHT: 681.82, nightTTC: 750, hourlyDay: 110, hourlyNight: 125 },
  { hours: '6H30', km: 585, dayHT: 650.00, dayTTC: 715, nightHT: 738.64, nightTTC: 812.50, hourlyDay: 110, hourlyNight: 125 },
  { hours: '7H', km: 630, dayHT: 668.18, dayTTC: 735, nightHT: 763.64, nightTTC: 840, hourlyDay: 105, hourlyNight: 120 },
  { hours: '7H30', km: 675, dayHT: 715.91, dayTTC: 787.50, nightHT: 818.18, nightTTC: 900, hourlyDay: 105, hourlyNight: 120 },
  { hours: '8H', km: 720, dayHT: 763.64, dayTTC: 840, nightHT: 872.73, nightTTC: 960, hourlyDay: 105, hourlyNight: 120 },
];

export default function TarifsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-[#0A0A0A] py-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-sm font-medium text-[#5CD85A]">Tarifs 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Des tarifs
            <span className="text-[#5CD85A]"> transparents</span>, sans surprise.
          </h1>
          <div className="text-xl text-white/70 max-w-3xl mx-auto mb-8 space-y-2">
            <p>
              Tous nos prix sont affichés clairement :
            </p>
            <p>
              Forfait agglomération, tarif minimum jour et nuit A/S OU A/R
            </p>
            <p>
              Trajet hors agglomération, déplacement au km en A/S ou A/R
            </p>
            <p className="text-sm mt-4 italic opacity-80">
              Forfait hors agglomération par MAD de votre chauffeur (Forfaits de 1h00 à 8h00 - calcul suivant un taux horaire jour ou nuit avec un kilométrage maximum, établi à l’avance... Déplacement conçu pour un A/R le même jour. Mise à disposition (MAD) automatique (mini 15 min).
            </p>
          </div>
          <a
            href="/docs/grille-tarifaire-2025-2026.pdf"
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            <Download className="h-5 w-5" />
            Télécharger la grille PDF
          </a>
        </div>
      </section>

      {/* Depot Info */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-center gap-3 text-gray-700">
            <MapPin className="h-5 w-5 text-[#5CD85A]" />
            <span className="font-medium">Point de départ et de retour :</span>
            <span className="text-[#0A0A0A] font-semibold">Base de stationnement - 74300 Cluses</span>
          </div>
        </div>
      </section>

      {/* Rate Schedule */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Sun className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#0A0A0A]">Tarif Jour</h3>
                    <p className="text-sm text-gray-600">7h00 - 20h00 (sauf dim/JF)</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Moon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#0A0A0A]">Tarif Nuit</h3>
                    <p className="text-sm text-gray-600">20h00 - 7h00 + dim/JF (24/24)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forfait Agglomération */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#0A0A0A] mb-3">Forfait Agglomération</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Calcul au départ et retour de la base de stationnement du VTC - Le forfait Agglomération inclus jusqu'à 25 km en aller-retour.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 text-center">
                <Sun className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                <div className="text-sm text-amber-700 font-medium mb-2">Tarif Jour</div>
                <div className="text-5xl font-bold text-[#0A0A0A] mb-1">33€</div>
                <div className="text-gray-600 text-sm">TTC (30€ HT)</div>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-8 border border-indigo-200 text-center">
                <Moon className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                <div className="text-sm text-indigo-700 font-medium mb-2">Tarif Nuit</div>
                <div className="text-5xl font-bold text-[#0A0A0A] mb-1">47,50€</div>
                <div className="text-gray-600 text-sm">TTC (43,18€ HT)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs au km */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#0A0A0A] mb-3">Tarifs Hors Agglomération</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Calcul au départ et retour de la base de stationnement du VTC - Le forfait Hors Agglomération est proposé au-delà de 25km en aller-retour, Pour (A/S ou A/R)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Day Rates */}
              <div className="bg-white rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-6">
                  <Sun className="h-8 w-8 text-amber-500" />
                  <h3 className="text-xl font-bold text-[#0A0A0A]">Tarif Jour</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl">
                    <span className="font-medium">Tarif kilométrique</span>
                    <span className="text-2xl font-bold text-amber-700">1,32€/km</span>
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    (1,20€ HT)
                  </div>
                </div>
              </div>

              {/* Night Rates */}
              <div className="bg-white rounded-2xl p-6 border border-indigo-200">
                <div className="flex items-center gap-3 mb-6">
                  <Moon className="h-8 w-8 text-indigo-500" />
                  <h3 className="text-xl font-bold text-[#0A0A0A]">Tarif Nuit</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl">
                    <span className="font-medium">Tarif kilométrique</span>
                    <span className="text-2xl font-bold text-indigo-700">1,90€/km</span>
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    (1,73€ HT)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forfaits Mise à Disposition */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-8 w-8 text-[#5CD85A]" />
              </div>
              <h2 className="text-3xl font-bold text-[#0A0A0A] mb-3">Mise à Disposition (MAD)</h2>
              <p className="text-gray-600">Chauffeur à disposition - A/R le même jour - Péage inclus</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg">
              <table className="w-full bg-white text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="p-4 text-left font-semibold">Forfait</th>
                    <th className="p-4 text-center font-semibold">Km max</th>
                    <th className="p-4 text-center font-semibold bg-amber-600">
                      <div className="flex items-center justify-center gap-2">
                        <Sun className="h-4 w-4" />
                        Jour TTC
                      </div>
                    </th>
                    <th className="p-4 text-center font-semibold bg-indigo-600">
                      <div className="flex items-center justify-center gap-2">
                        <Moon className="h-4 w-4" />
                        Nuit TTC
                      </div>
                    </th>
                    <th className="p-4 text-center font-semibold">Taux horaire</th>
                  </tr>
                </thead>
                <tbody>
                  {FORFAITS_MDA.map((f, i) => (
                    <tr key={f.hours} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="p-4 font-bold text-[#0A0A0A]">{f.hours}</td>
                      <td className="p-4 text-center text-gray-600">{f.km} km</td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-amber-700 text-lg">{f.dayTTC}€</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-indigo-700 text-lg">{f.nightTTC}€</span>
                      </td>
                      <td className="p-4 text-center text-xs text-gray-500">
                        <span className="text-amber-600 font-medium">{f.hourlyDay}€/H jour</span>
                        <br />
                        <span className="text-indigo-600 font-medium">{f.hourlyNight}€/H nuit</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Heure supplémentaire (jour)</p>
                    <p className="text-amber-700 font-bold">116€ TTC</p>
                    <p className="text-xs text-amber-600">Tarifée par tranche de 10 min entamée</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-indigo-800 font-medium">Heure supplémentaire (nuit)</p>
                    <p className="text-indigo-700 font-bold">140€ TTC</p>
                    <p className="text-xs text-indigo-600">Tarifée par tranche de 10 min entamée</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MDA Waiting */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#0A0A0A] mb-2">Mise à Disposition (MAD)</h3>
              <p className="text-gray-600">Mise à Disposition - Attente Clientèle<br />10 minutes gratuites, au-delà tarif à la minute</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-amber-200 text-center">
                <Sun className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <div className="text-sm text-amber-700 font-medium mb-2">Jour</div>
                <div className="text-4xl font-bold text-[#0A0A0A]">1,20€/min</div>
                <div className="text-gray-500 text-sm mt-2">= 66€/heure TTC</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-indigo-200 text-center">
                <Moon className="h-8 w-8 text-indigo-500 mx-auto mb-3" />
                <div className="text-sm text-indigo-700 font-medium mb-2">Nuit</div>
                <div className="text-4xl font-bold text-[#0A0A0A]">1,80€/min</div>
                <div className="text-gray-500 text-sm mt-2">= 99€/heure TTC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Info */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-[#0A0A0A] mb-6">Informations importantes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Tous les prix sont <strong>TTC</strong> (TVA 10% sur le trajet)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Péages <strong>inclus</strong> sur les prix estimés (TVA 20%)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Devis valable <strong>5 jours</strong></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">MDA = Mise à disposition en sus (TVA 20%)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Départ et retour au point de base de stationnement (dépôt VTC)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5CD85A] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">A/S = Aller Simple, A/R = Aller-Retour</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <Link href="/cgv" className="inline-flex items-center gap-2 text-[#0A0A0A] hover:text-[#5CD85A] font-medium">
                    <FileText className="h-5 w-5" />
                    Voir les CGV
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Obtenez une estimation instantanée
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Notre calculateur vous donne le prix exact en quelques secondes
          </p>
          <Button asChild size="lg" className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] h-14 px-10 rounded-xl text-lg">
            <Link href="/reservation">
              Calculer mon trajet
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
