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
  IconClock,
  IconReceipt,
} from '@tabler/icons-react';

/**
 * Type matching the PricingDebugInfo from lib/pricing/tariffs-2026.ts
 */
interface PricingDebugInfo {
  rateType: {
    isNight: boolean;
    reason: string;
    details: {
      pickupTime: string;
      hour: number;
      dayOfWeek: string;
      isNightHours: boolean;
      isSunday: boolean;
      isHoliday: boolean;
    };
  };
  distances: {
    ca_out: number;
    tp: number;
    ca_return: number;
    totalRoundTrip: number;
    explanation: string;
  };
  bracket: {
    value: string;
    reason: string;
    thresholds: string;
  };
  rates: {
    pricePerKmCA: number;
    pricePerKmTP: number;
    rateTableUsed: 'DAY_RATES' | 'NIGHT_RATES';
    allCARates: Record<string, number>;
  };
  calculation: {
    steps: Array<{
      step: number;
      description: string;
      formula: string;
      result: number;
    }>;
    subtotalBeforeTolls: number;
    tollCalculation: string;
    finalTotal: number;
  };
  forfaitAgglomeration: {
    applied: boolean;
    reason: string;
    threshold: number;
    forfaitPrice: number | null;
  };
  summary: string[];
}

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
      pricePerKmCA?: number;
      pricePerKmTP?: number;
    };
    breakdown?: {
      costCA_out?: number;
      costTP?: number;
      costCA_return?: number;
      tollCost?: number;
      isForfaitAgglomeration?: boolean;
      bracket?: string;
      pricePerKmCA?: number;
      pricePerKmTP?: number;
    };
    debugInfo?: PricingDebugInfo;
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
  const debugInfo = bookingData.debugInfo;

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
          {/* Quick Summary from debugInfo */}
          {debugInfo?.summary && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
                <IconReceipt className="h-4 w-4" />
                RÉSUMÉ RAPIDE
              </div>
              <div className="space-y-1 font-mono text-sm">
                {debugInfo.summary.map((line, i) => (
                  <div key={i} className="text-white/80">{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Rate Type Determination */}
          {debugInfo?.rateType && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                <IconClock className="h-4 w-4" />
                DÉTERMINATION TARIF JOUR/NUIT
              </div>

              <div className={`rounded-2xl p-4 border-2 ${debugInfo.rateType.isNight
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">
                    {debugInfo.rateType.isNight ? '🌙' : '☀️'}
                  </div>
                  <div>
                    <div className={`font-bold text-lg ${debugInfo.rateType.isNight ? 'text-indigo-400' : 'text-amber-400'}`}>
                      {debugInfo.rateType.isNight ? 'Tarif NUIT' : 'Tarif JOUR'}
                    </div>
                    <div className="text-sm text-white/70">{debugInfo.rateType.reason}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className={`p-2 rounded-lg ${debugInfo.rateType.details.isNightHours ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-bold">Heure: {debugInfo.rateType.details.hour}h</div>
                    <div>{debugInfo.rateType.details.isNightHours ? '✓ 20h-7h' : '✗ 7h-20h'}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${debugInfo.rateType.details.isSunday ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-bold">{debugInfo.rateType.details.dayOfWeek}</div>
                    <div>{debugInfo.rateType.details.isSunday ? '✓ Dimanche' : '✗ Pas dimanche'}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${debugInfo.rateType.details.isHoliday ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-bold">Jour férié</div>
                    <div>{debugInfo.rateType.details.isHoliday ? '✓ Oui' : '✗ Non'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Distance Segments */}
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
                  <span className="text-cyan-400 font-bold">{(debugInfo?.distances?.ca_out ?? bookingData.distanceCA)?.toFixed(1) || '0.0'} km</span>
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
                  <span className="text-green-400 font-bold">{(debugInfo?.distances?.tp ?? bookingData.distanceTP ?? bookingData.distance)?.toFixed(1) || '0.0'} km</span>
                  {bookingData.tripType === 'round-trip' && (
                    <div className="text-xs text-yellow-400">→ {(((debugInfo?.distances?.tp ?? bookingData.distanceTP ?? bookingData.distance) || 0) * 2).toFixed(1)} km facturés</div>
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
                  <span className="text-purple-400 font-bold">{(debugInfo?.distances?.ca_return ?? bookingData.distanceReturn)?.toFixed(1) || '0.0'} km</span>
                  <div className="text-xs text-green-400">✓ Toujours inclus</div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-white/80 font-semibold">Distance totale A/R</span>
                  <span className="text-white font-bold">
                    {(debugInfo?.distances?.totalRoundTrip ??
                      ((bookingData.distanceCA || 0) + (bookingData.distanceTP || bookingData.distance || 0) + (bookingData.distanceReturn || 0))
                    ).toFixed(1)} km
                  </span>
                </div>
                <div className="text-xs text-white/50 mt-2">
                  {bookingData.tripType === 'round-trip' ? (
                    <div className="space-y-1">
                      <div>CA aller ({(debugInfo?.distances?.ca_out ?? bookingData.distanceCA)?.toFixed(1)} km) + TP ×1 ({(debugInfo?.distances?.tp ?? bookingData.distanceTP ?? bookingData.distance)?.toFixed(1)} km) + CA retour ({(debugInfo?.distances?.ca_return ?? bookingData.distanceReturn)?.toFixed(1)} km)</div>
                      <div className="text-yellow-400">⚠️ Note: Le TP est facturé ×2 ({(((debugInfo?.distances?.tp ?? bookingData.distanceTP ?? bookingData.distance) || 0) * 2).toFixed(1)} km) mais n'est parcouru qu'une fois</div>
                    </div>
                  ) : (
                    debugInfo?.distances?.explanation ||
                    `CA aller + TP + CA retour = ${((bookingData.distanceCA || 0) + (bookingData.distanceTP || bookingData.distance || 0) + (bookingData.distanceReturn || 0)).toFixed(1)} km`
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Bracket & Rates */}
          {debugInfo?.bracket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                <IconInfoCircle className="h-4 w-4" />
                PALIER TARIFAIRE
              </div>

              <div className="bg-black/30 rounded-2xl p-4 font-mono text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Palier sélectionné:</span>
                  <span className="text-cyan-400 font-bold text-lg">{debugInfo.bracket.value}</span>
                </div>
                <div className="text-xs text-white/50">{debugInfo.bracket.reason}</div>
                <div className="text-xs text-white/40">Paliers disponibles: {debugInfo.bracket.thresholds}</div>

                {/* Show all CA rates for context */}
                {debugInfo.rates && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-white/60 mb-2">Grille {debugInfo.rates.rateTableUsed}:</div>
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      {Object.entries(debugInfo.rates.allCARates).map(([bracket, rate]) => (
                        <div
                          key={bracket}
                          className={`p-1.5 rounded text-center ${bracket === debugInfo.bracket.value
                              ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50'
                              : 'bg-white/5 text-white/50'
                            }`}
                        >
                          <div className="font-bold">{bracket}</div>
                          <div>{rate.toFixed(2)}€</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Calculation Steps */}
          {debugInfo?.calculation?.steps && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                <IconCalculator className="h-4 w-4" />
                ÉTAPES DU CALCUL
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-5 border border-orange-500/20">
                <div className="space-y-3 font-mono text-sm">
                  {debugInfo.calculation.steps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl ${i === debugInfo.calculation.steps.length - 1
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-white/5'
                        }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/80 font-medium">{step.description}</div>
                        <div className="text-xs text-white/50 mt-1">{step.formula}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-bold ${i === debugInfo.calculation.steps.length - 1
                            ? 'text-emerald-400 text-lg'
                            : 'text-white'
                          }`}>
                          {step.result.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Final Total */}
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between items-center text-xl">
                      <span className="text-white font-bold">TOTAL TTC:</span>
                      <span className="text-[#5CD85A] font-bold">{debugInfo.calculation.finalTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forfait Agglomeration Info */}
          {debugInfo?.forfaitAgglomeration && (
            <div className={`rounded-2xl p-4 ${debugInfo.forfaitAgglomeration.applied
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-white/5 border border-white/10'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-bold ${debugInfo.forfaitAgglomeration.applied ? 'text-emerald-400' : 'text-white/60'}`}>
                  {debugInfo.forfaitAgglomeration.applied ? '✓ Forfait agglomération APPLIQUÉ' : '✗ Forfait agglomération NON applicable'}
                </span>
              </div>
              <div className="text-sm text-white/60">
                {debugInfo.forfaitAgglomeration.reason}
              </div>
              {debugInfo.forfaitAgglomeration.forfaitPrice && (
                <div className="mt-2 text-lg font-bold text-emerald-400">
                  Prix forfait: {debugInfo.forfaitAgglomeration.forfaitPrice.toFixed(2)}€ TTC
                </div>
              )}
            </div>
          )}

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
              <pre className="mt-3 bg-black/50 rounded-xl p-4 text-xs text-green-400 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify({
                  debugInfo: debugInfo,
                  legacy: {
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
                      pricePerKmCA: breakdown?.pricePerKmCA,
                      pricePerKmTP: breakdown?.pricePerKmTP,
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



