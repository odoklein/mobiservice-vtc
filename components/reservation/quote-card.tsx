'use client';

import { useState } from 'react';
import {
  IconAlertTriangle,
  IconBug,
  IconCalendar,
  IconClock,
  IconLoader2,
  IconMoon,
  IconRoute,
  IconShieldCheck,
  IconSun,
  IconWallet,
} from '@tabler/icons-react';
import { PricingDebugPanel } from '@/components/debug-ui';
import type { ImmobilisationMADResult } from '@/lib/booking/immobilisation-mad';
import { Card } from './controls';
import type { Quote, TripType } from './use-quote';
import { formatDuration, formatEuro } from './utils';

interface QuoteCardProps {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  tripType: TripType;
  waitingMinutes: number;
  immobilisation: ImmobilisationMADResult | null;
  returnDaysAfter: number | null;
  arTooShort: boolean;
  onRetry: () => void;
  onSwitchToOneWay: () => void;
  /** Données au format de l'ancienne page, consommées par le panneau de debug. */
  debugData: Record<string, unknown>;
}

export function QuoteCard({
  quote,
  loading,
  error,
  tripType,
  waitingMinutes,
  immobilisation,
  returnDaysAfter,
  arTooShort,
  onRetry,
  onSwitchToOneWay,
  debugData,
}: QuoteCardProps) {
  const [debug, setDebug] = useState(false);

  if (loading && !quote) {
    return (
      <Card className="flex items-center gap-3" >
        <IconLoader2 size={18} aria-hidden className="text-[#4BC449] animate-spin" />
        <p role="status" className="text-sm text-gray-600">
          Calcul du tarif en cours…
        </p>
      </Card>
    );
  }

  if (error && !loading) {
    return (
      <Card className="flex items-start gap-3">
        <IconAlertTriangle size={18} aria-hidden className="text-red-500 mt-0.5 shrink-0" />
        <div role="alert" className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Estimation indisponible</p>
          <p className="text-xs text-gray-500 mt-0.5">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-[#27802a] hover:underline focus-visible:outline-2 focus-visible:outline-[#4BC449]"
          >
            Réessayer
          </button>
        </div>
      </Card>
    );
  }

  if (!quote) return null;

  const isNight = quote.isNightRate;
  const mixed = quote.isMixedRate;
  const extraImmobilisation = immobilisation && immobilisation.priceTTC > 0 ? immobilisation.priceTTC : 0;
  const isRoundTrip = quote.kind === 'transfer' && tripType === 'round-trip';

  return (
    <Card className={loading ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Estimation du prix</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {quote.kind === 'hourly' ? 'Mise à disposition' : isRoundTrip ? 'Aller-retour' : 'Aller simple'}
          </p>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              mixed ? 'bg-violet-50 text-violet-800' : isNight ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {mixed ? (
              <>
                <IconSun size={13} aria-hidden />
                <IconMoon size={13} aria-hidden />
              </>
            ) : isNight ? (
              <IconMoon size={13} aria-hidden />
            ) : (
              <IconSun size={13} aria-hidden />
            )}
            {mixed
              ? `Tarif mixte · aller ${isNight ? 'nuit' : 'jour'}, retour ${quote.isNightRateReturn ? 'nuit' : 'jour'}`
              : isNight
                ? 'Tarif nuit / Dim & JF'
                : 'Tarif jour'}
          </span>
        </div>
        <div className="text-right shrink-0" aria-live="polite">
          {loading ? (
            <IconLoader2 size={22} aria-label="Mise à jour du tarif" className="text-[#4BC449] animate-spin ml-auto" />
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-bold text-[#27802a] tabular-nums">{formatEuro(quote.totalTTC)}</span>
              <p className="text-[11px] text-gray-500 mt-0.5">TTC · TVA incluse</p>
            </>
          )}
        </div>
      </div>

      {extraImmobilisation > 0 && !loading && (
        <p className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          <strong className="text-gray-900">+ {formatEuro(extraImmobilisation)} TTC</strong> d&apos;immobilisation
          {returnDaysAfter ? ` (retour J+${returnDaysAfter})` : ''}, facturée en sus de l&apos;estimation.
        </p>
      )}

      {quote.forfait?.adjusted && quote.forfait.message && (
        <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <IconAlertTriangle size={16} aria-hidden className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold">Forfait ajusté automatiquement</p>
            <p>{quote.forfait.message}</p>
          </div>
        </div>
      )}

      {arTooShort && (
        <div role="alert" className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <IconAlertTriangle size={16} aria-hidden className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p>
              Ce trajet fait moins de 25 km au total. Pour un aller-retour avec retour 1 à 3 jours après l&apos;aller, nous
              vous conseillons le forfait agglomération (aller simple).
            </p>
            <button
              type="button"
              onClick={onSwitchToOneWay}
              className="mt-2 font-semibold underline hover:no-underline focus-visible:outline-2 focus-visible:outline-amber-600"
            >
              Passer en aller simple
            </button>
          </div>
        </div>
      )}

      <dl className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs">
        <Row icon={IconRoute} label="Distance passager">
          {quote.distanceTP.toFixed(1).replace('.', ',')} km{isRoundTrip ? ' (×2)' : ''}
        </Row>
        {quote.kind === 'transfer' && quote.totalAR !== undefined && isRoundTrip && (
          <Row icon={IconRoute} label="Distance totale A/R">
            {quote.totalAR.toFixed(0)} km
          </Row>
        )}
        <Row icon={IconClock} label="Durée estimée">
          {formatDuration(isRoundTrip ? quote.duration * 2 : quote.duration)}
          {isRoundTrip ? ' (A/R)' : ''}
        </Row>
        {quote.toll?.detected && (
          <Row icon={IconWallet} label="Péages inclus">
            {formatEuro(quote.toll.totalIncluded)}
          </Row>
        )}
        {waitingMinutes > 0 && quote.kind === 'transfer' && (
          <Row icon={IconClock} label="Temps d'attente (MAD)">
            {waitingMinutes} min
            {quote.mad ? (quote.mad.cost > 0 ? ` · ${formatEuro(quote.mad.cost)}` : ' · gratuit') : ''}
          </Row>
        )}
        {immobilisation && immobilisation.priceTTC > 0 && (
          <Row icon={IconClock} label="Immobilisation">
            {immobilisation.label}
          </Row>
        )}
        <Row label="Sous-total HT">{formatEuro(quote.totalHT)}</Row>
        <Row label="Dont TVA">{formatEuro(quote.tva)}</Row>
      </dl>

      {quote.kind === 'hourly' && (
        <p className="mt-3 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
          Les forfaits incluent la distance et le temps indiqué. Tout dépassement sera facturé au tarif en vigueur.
        </p>
      )}

      <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2" aria-label="Avantages">
        {[
          { icon: IconShieldCheck, text: 'Prix fixe garanti' },
          { icon: IconClock, text: 'Annulation gratuite > 8 h avant' },
          { icon: IconCalendar, text: 'Paiement à la prise en charge' },
        ].map((chip) => (
          <li key={chip.text} className="flex items-center gap-1.5 bg-[#4BC449]/5 border border-[#4BC449]/20 rounded-full px-3 py-1.5">
            <chip.icon size={13} aria-hidden className="text-[#27802a] shrink-0" />
            <span className="text-xs font-medium text-[#27802a]">{chip.text}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-expanded={debug}
        onClick={() => setDebug((v) => !v)}
        className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-[#4BC449] rounded"
      >
        <IconBug size={12} aria-hidden />
        {debug ? 'Masquer' : 'Afficher'} le détail du calcul
      </button>
      {debug && (
        <div className="mt-3">
          <PricingDebugPanel bookingData={debugData} />
        </div>
      )}
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-gray-500 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-gray-500" />}
        {label}
      </dt>
      <dd className="text-gray-900 font-medium text-right">{children}</dd>
    </div>
  );
}
