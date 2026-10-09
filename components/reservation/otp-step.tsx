'use client';

import { useEffect, useRef } from 'react';
import { IconArrowLeft, IconCheck, IconLoader2, IconLock } from '@tabler/icons-react';
import { Card } from './controls';

interface OtpStepProps {
  email: string;
  code: string[];
  onCodeChange: (code: string[]) => void;
  error: string;
  info: string;
  loading: boolean;
  resendIn: number;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  summary: { label: string; value: string }[];
  total: string;
}

export function OtpStep({
  email,
  code,
  onCodeChange,
  error,
  info,
  loading,
  resendIn,
  onVerify,
  onResend,
  onBack,
  summary,
  total,
}: OtpStepProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const setDigit = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      const next = [...code];
      next[index] = '';
      onCodeChange(next);
      return;
    }
    // Saisie multiple (autofill, collage) : on répartit sur les cases suivantes
    const next = [...code];
    digits
      .slice(0, 6 - index)
      .split('')
      .forEach((d, i) => {
        next[index + i] = d;
      });
    onCodeChange(next);
    refs.current[Math.min(index + digits.length, 5)]?.focus();
  };

  const complete = code.every(Boolean);

  return (
    <Card className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#4BC449]/10 flex items-center justify-center mx-auto mb-5">
        <IconLock size={32} aria-hidden className="text-[#27802a]" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1.5">Code de vérification</h2>
      <p className="text-sm text-gray-600">
        Un code à 6 chiffres a été envoyé à <strong className="text-gray-900 break-all">{email}</strong>
      </p>
      <p className="mt-4 text-sm text-blue-900 bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-left leading-relaxed">
        <strong>Attente de confirmation du chauffeur.</strong> Votre demande sera examinée ; vous recevrez une notification
        par e-mail.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (complete && !loading) onVerify();
        }}
      >
        <fieldset className="min-w-0 border-0 p-0 m-0">
          <legend className="sr-only">Code de vérification à 6 chiffres</legend>
          <div className="flex justify-center gap-1.5 sm:gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  refs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={6}
                value={digit}
                aria-label={`Chiffre ${index + 1} sur 6`}
                aria-invalid={!!error}
                onChange={(e) => setDigit(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !code[index] && index > 0) {
                    refs.current[index - 1]?.focus();
                  } else if (e.key === 'ArrowLeft' && index > 0) {
                    refs.current[index - 1]?.focus();
                  } else if (e.key === 'ArrowRight' && index < 5) {
                    refs.current[index + 1]?.focus();
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={`flex-1 min-w-0 max-w-[3rem] h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 text-gray-900 focus:outline-none focus:border-[#4BC449] focus:ring-4 focus:ring-[#4BC449]/15 ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              />
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="min-h-[1.5rem] mt-3 text-sm">
          {error ? (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          ) : info ? (
            <p className="text-[#27802a]">{info}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!complete || loading}
          className={`mt-2 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
            complete && !loading
              ? 'bg-[#4BC449] hover:bg-[#3fb340] text-[#0a1628] shadow-lg shadow-[#4BC449]/25'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <IconLoader2 size={16} aria-hidden className="animate-spin" /> Envoi de la demande…
            </>
          ) : (
            <>
              Confirmer ma demande <IconCheck size={16} aria-hidden />
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={onResend}
        disabled={resendIn > 0 || loading}
        className="mt-4 text-sm font-medium text-[#27802a] hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#4BC449] rounded"
      >
        {resendIn > 0 ? `Renvoyer le code (${resendIn} s)` : 'Renvoyer le code'}
      </button>

      <dl className="mt-6 p-4 bg-gray-50 rounded-xl text-left text-sm space-y-2">
        {summary.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-gray-500 shrink-0">{row.label}</dt>
            <dd className="text-gray-900 font-medium text-right">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 pt-2 border-t border-gray-200">
          <dt className="text-gray-500">Estimation</dt>
          <dd className="text-[#27802a] font-bold">{total}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
      >
        <IconArrowLeft size={16} aria-hidden /> Modifier mes informations
      </button>
    </Card>
  );
}
