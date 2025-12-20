'use client';

import React, { useState } from 'react';
import {
  IconBug,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconCalculator,
  IconInfoCircle,
  IconRoute,
} from '@tabler/icons-react';

interface PricingDebugPanelProps {
  bookingData: {
    distanceCA?: number;
    distanceTP?: number;
    distanceReturn?: number;
    distance?: number;
    tripType?: 'one-way' | 'round-trip';
    isNightRate?: boolean;
    rateType?: string;
    totalPrice?: number;
    totalPriceHT?: number;
    tvaAmount?: number;
    duration?: number;
    pickupDate?: Date | string;
    pickupTime?: string;
    passengers?: number;
    luggage?: number;
    priceBreakdown?: {
      costCA_out?: number;
      costTP?: number;
      costCA_return?: number;
      tollCost?: number;
      isForfaitAgglomeration?: boolean;
      bracket?: string;
    };
    breakdown?: {
      costCA_out?: number;
      costTP?: number;
      costCA_return?: number;
      tollCost?: number;
      isForfaitAgglomeration?: boolean;
      bracket?: string;
    };
  };
}

/**
 * Debug Panel for Pricing Calculations
 * 
 * This component displays detailed pricing calculation information
 * for debugging and verification purposes.
 * 
 * Usage:
 * ```tsx
 * import { PricingDebugPanel } from '@/components/debug-ui/PricingDebugPanel';
 * 
 * // In your component:
 * const [debugMode, setDebugMode] = useState(false);
 * 
 * return (
 *   <>
 *     <button onClick={() => setDebugMode(!debugMode)}>Toggle Debug</button>
 *     {debugMode && <PricingDebugPanel bookingData={bookingData} />}
 *   </>
 * );
 * ```
 */
export function PricingDebugPanel({ bookingData }: PricingDebugPanelProps) {
  const [debugExpanded, setDebugExpanded] = useState(true);

  const breakdown = bookingData.priceBreakdown || bookingData.breakdown;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-orange-500/20 animate-fade-in-up">
      {/* Debug Header */}
      <button
        type="button"
        onClick={() => setDebugExpanded(!debugExpanded)}
        className="w-full flex items-center justify-between p-5 bg-orange-500/10 border-b border-orange-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <IconCalculator className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-white flex items-center gap-2">
              🔧 Détails du calcul tarifaire
              <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-mono">
                DEBUG
              </span>
            </div>
            <div className="text-sm text-white/60">Informations techniques et formules</div>
          </div>
        </div>
        {debugExpanded ? (
          <IconChevronUp className="h-5 w-5 text-white/60" />
        ) : (
          <IconChevronDown className="h-5 w-5 text-white/60" />
        )}
      </button>

      {debugExpanded && (
        <div className="p-6 space-y-6">
          {/* Section 1: Distance Segments */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
              <IconRoute className="h-4 w-4" />
              SEGMENTS DE DISTANCE (Règle n°1)
            </div>
            
            <div className="bg-black/30 rounded-2xl p-4 space-y-3 font-mono text-sm">
              {/* CA Aller */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">CA</span>
                  </div>
                  <div>
                    <span className="text-white/60">Dépôt → Départ</span>
                    <div className="text-xs text-white/40">Coût Additionnel (aller)</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-bold">{bookingData.distanceCA?.toFixed(1) || '0.0'} km</span>
                </div>
              </div>

              {/* TP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-xs font-bold">TP</span>
                  </div>
                  <div>
                    <span className="text-white/60">Départ → Arrivée</span>
                    <div className="text-xs text-white/40">
                      Trajet Principal 
                      {bookingData.tripType === 'round-trip' && (
                        <span className="text-yellow-400 ml-1">(×2 pour A/R)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-bold">{bookingData.distanceTP?.toFixed(1) || bookingData.distance?.toFixed(1) || '0.0'} km</span>
                  {bookingData.tripType === 'round-trip' && (
                    <div className="text-xs text-yellow-400">→ {((bookingData.distanceTP || bookingData.distance || 0) * 2).toFixed(1)} km facturés</div>
                  )}
                </div>
              </div>

              {/* CA Retour */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 text-xs font-bold">CA</span>
                  </div>
                  <div>
                    <span className="text-white/60">Arrivée → Dépôt</span>
                    <div className="text-xs text-white/40">Coût Additionnel (retour)</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-purple-400 font-bold">{bookingData.distanceReturn?.toFixed(1) || '0.0'} km</span>
                  <div className="text-xs text-green-400">✓ Toujours inclus</div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-white/80 font-semibold">Distance totale A/R</span>
                  <span className="text-white font-bold">
                    {((bookingData.distanceCA || 0) + 
                      (bookingData.tripType === 'round-trip' 
                        ? (bookingData.distanceTP || bookingData.distance || 0) * 2 
                        : (bookingData.distanceTP || bookingData.distance || 0)) + 
                      (bookingData.distanceReturn || 0)).toFixed(1)} km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tariff Applied */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
              <IconInfoCircle className="h-4 w-4" />
              TARIF APPLIQUÉ
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Day/Night */}
              <div className={`
                rounded-2xl p-4 border-2
                ${bookingData.isNightRate 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : 'bg-amber-500/10 border-amber-500/30'
                }
              `}>
                <div className="text-3xl mb-2">
                  {bookingData.isNightRate ? '🌙' : '☀️'}
                </div>
                <div className={`font-bold ${bookingData.isNightRate ? 'text-indigo-400' : 'text-amber-400'}`}>
                  {bookingData.isNightRate ? 'Tarif NUIT' : 'Tarif JOUR'}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {bookingData.isNightRate ? '20h-7h + Dim & JF' : '7h-20h (sauf Dim & JF)'}
                </div>
              </div>

              {/* Trip Type */}
              <div className={`
                rounded-2xl p-4 border-2
                ${bookingData.tripType === 'round-trip' 
                  ? 'bg-yellow-500/10 border-yellow-500/30' 
                  : 'bg-blue-500/10 border-blue-500/30'
                }
              `}>
                <div className="text-3xl mb-2">
                  {bookingData.tripType === 'round-trip' ? '🔄' : '➡️'}
                </div>
                <div className={`font-bold ${bookingData.tripType === 'round-trip' ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {bookingData.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {bookingData.tripType === 'round-trip' ? 'TP × 2, Péages × 2' : 'TP × 1, Péages × 1'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Rate Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
              <IconCode className="h-4 w-4" />
              GRILLE TARIFAIRE
            </div>

            <div className="bg-black/30 rounded-2xl p-4 font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Palier km</span>
                <span className="text-cyan-400">{breakdown?.bracket || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Prix TP/km</span>
                <span className="text-green-400">{bookingData.isNightRate ? '1.90' : '1.32'} €/km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Prix CA/km (selon palier)</span>
                <span className="text-blue-400">
                  {(() => {
                    const bracket = breakdown?.bracket;
                    const isNight = bookingData.isNightRate;
                    const rates: Record<string, { day: number; night: number }> = {
                      '0-25': { day: 1.32, night: 1.90 },
                      '25-50': { day: 1.32, night: 1.70 },
                      '50-75': { day: 1.10, night: 1.40 },
                      '75-100': { day: 0.90, night: 1.10 },
                      '100+': { day: 0.70, night: 0.70 },
                    };
                    const rate = rates[bracket as string];
                    return rate ? (isNight ? rate.night : rate.day).toFixed(2) : 'N/A';
                  })()} €/km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Forfait agglomération</span>
                <span className={breakdown?.isForfaitAgglomeration ? 'text-green-400' : 'text-white/40'}>
                  {breakdown?.isForfaitAgglomeration 
                    ? `OUI (${bookingData.isNightRate ? '47.50' : '33.00'}€)` 
                    : 'NON (>25km)'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Formula Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
              <IconCalculator className="h-4 w-4" />
              FORMULE DE CALCUL
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-5 border border-orange-500/20">
              <div className="font-mono text-sm space-y-3">
                {breakdown?.isForfaitAgglomeration ? (
                  <>
                    <div className="text-white/80 mb-4 text-center p-3 bg-green-500/10 rounded-xl">
                      <span className="text-green-400 font-bold">FORFAIT AGGLOMÉRATION APPLIQUÉ</span>
                      <br />
                      <span className="text-white/60">Distance A/R ≤ 25 km</span>
                    </div>
                    <div className="text-center text-2xl font-bold text-[#5CD85A]">
                      = {bookingData.isNightRate ? '47.50' : '33.00'} € TTC
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white/60 text-xs mb-3">CT = (CA_aller × coef_CA) + (TP × coef_TP{bookingData.tripType === 'round-trip' ? ' × 2' : ''}) + (CA_retour × coef_CA)</div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400">CA aller:</span>
                        <span className="text-white">
                          {bookingData.distanceCA?.toFixed(1) || '0'} km × {(() => {
                            const bracket = breakdown?.bracket;
                            const isNight = bookingData.isNightRate;
                            const rates: Record<string, { day: number; night: number }> = {
                              '25-50': { day: 1.32, night: 1.70 },
                              '50-75': { day: 1.10, night: 1.40 },
                              '75-100': { day: 0.90, night: 1.10 },
                              '100+': { day: 0.70, night: 0.70 },
                            };
                            const rate = rates[bracket as string];
                            return rate ? (isNight ? rate.night : rate.day).toFixed(2) : '1.32';
                          })()} = <span className="text-cyan-400">{breakdown?.costCA_out?.toFixed(2) || 'N/A'} €</span>
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-green-400">TP{bookingData.tripType === 'round-trip' ? ' (×2)' : ''}:</span>
                        <span className="text-white">
                          {bookingData.tripType === 'round-trip' 
                            ? `${bookingData.distanceTP?.toFixed(1) || bookingData.distance?.toFixed(1) || '0'} × 2 × ${bookingData.isNightRate ? '1.90' : '1.32'}`
                            : `${bookingData.distanceTP?.toFixed(1) || bookingData.distance?.toFixed(1) || '0'} km × ${bookingData.isNightRate ? '1.90' : '1.32'}`
                          } = <span className="text-green-400">{breakdown?.costTP?.toFixed(2) || 'N/A'} €</span>
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400">CA retour:</span>
                        <span className="text-white">
                          {bookingData.distanceReturn?.toFixed(1) || '0'} km × coef = <span className="text-purple-400">{breakdown?.costCA_return?.toFixed(2) || 'N/A'} €</span>
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-white/80">Sous-total:</span>
                        <span className="text-white font-bold">
                          {((breakdown?.costCA_out || 0) + 
                            (breakdown?.costTP || 0) + 
                            (breakdown?.costCA_return || 0)).toFixed(2)} € TTC
                        </span>
                      </div>
                    </div>

                    {(breakdown?.tollCost || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-yellow-400">+ Péages:</span>
                        <span className="text-yellow-400">{breakdown?.tollCost} €</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Raw Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
              <IconCode className="h-4 w-4" />
              DONNÉES BRUTES (JSON)
            </div>

            <details className="group">
              <summary className="cursor-pointer text-white/60 text-sm hover:text-white/80 transition-colors">
                Cliquer pour afficher/masquer les données complètes...
              </summary>
              <pre className="mt-3 bg-black/50 rounded-xl p-4 text-xs text-green-400 overflow-x-auto max-h-64 overflow-y-auto">
{JSON.stringify({
  distances: {
    CA_aller: bookingData.distanceCA,
    TP: bookingData.distanceTP || bookingData.distance,
    CA_retour: bookingData.distanceReturn,
    total_AR: (bookingData.distanceCA || 0) + (bookingData.distanceTP || bookingData.distance || 0) + (bookingData.distanceReturn || 0),
  },
  tarification: {
    isNightRate: bookingData.isNightRate,
    rateType: bookingData.rateType,
    tripType: bookingData.tripType,
    bracket: breakdown?.bracket,
    isForfaitAgglomeration: breakdown?.isForfaitAgglomeration,
  },
  prix: {
    costCA_out: breakdown?.costCA_out,
    costTP: breakdown?.costTP,
    costCA_return: breakdown?.costCA_return,
    tollCost: breakdown?.tollCost,
    totalHT: bookingData.totalPriceHT,
    tva: bookingData.tvaAmount,
    totalTTC: bookingData.totalPrice,
  },
  metadata: {
    pickupDate: bookingData.pickupDate instanceof Date ? bookingData.pickupDate.toISOString() : bookingData.pickupDate,
    pickupTime: bookingData.pickupTime,
    duration: bookingData.duration,
    passengers: bookingData.passengers,
    luggage: bookingData.luggage,
  }
}, null, 2)}
              </pre>
            </details>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-xs text-white/40">
              🔧 Mode Debug actif • Ces informations sont destinées au développement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Debug Toggle Button Component
 */
export function DebugModeToggle({ 
  debugMode, 
  onToggle 
}: { 
  debugMode: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300
        ${debugMode 
          ? 'bg-orange-50 border-2 border-orange-200' 
          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${debugMode ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}
        `}>
          <IconBug className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-gray-900">Mode Debug</div>
          <div className="text-xs text-gray-500">Afficher les détails du calcul</div>
        </div>
      </div>
      <div className={`
        w-12 h-6 rounded-full transition-colors duration-300 relative
        ${debugMode ? 'bg-orange-500' : 'bg-gray-300'}
      `}>
        <div className={`
          absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300
          ${debugMode ? 'translate-x-7' : 'translate-x-1'}
        `} />
      </div>
    </button>
  );
}

export default PricingDebugPanel;

