'use client';

import type { ComponentType, ReactNode } from 'react';
import { useId } from 'react';
import { IconCheck, IconMinus, IconPlus } from '@tabler/icons-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-xl p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900">{children}</h3>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

/* ---------------------------------- counter ------------------------------- */

interface StepperProps {
  label: string;
  sub?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Bloque le « + » indépendamment du max (ex. total passagers atteint). */
  incrementDisabled?: boolean;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export function Stepper({ label, sub, value, min, max, step = 1, incrementDisabled, format, onChange, icon: Icon }: StepperProps) {
  const id = useId();
  const btn =
    'w-10 h-10 sm:w-9 sm:h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]';
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <span id={id} className="text-sm font-medium text-gray-900 flex items-center gap-2">
          {Icon && <Icon size={15} className="text-gray-500" />}
          {label}
        </span>
        {sub && <span className="text-xs text-gray-500 block mt-0.5">{sub}</span>}
      </div>
      <div role="group" aria-labelledby={id} className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          aria-label={`Moins — ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          className={btn}
        >
          <IconMinus size={15} />
        </button>
        <span aria-live="polite" className="text-base font-bold text-gray-900 min-w-[2.5rem] text-center tabular-nums">
          {format ? format(value) : value}
        </span>
        <button
          type="button"
          aria-label={`Plus — ${label}`}
          disabled={value >= max || !!incrementDisabled}
          onClick={() => onChange(Math.min(max, value + step))}
          className={btn}
        >
          <IconPlus size={15} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- radio choices ---------------------------- */

interface ChoiceProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/** Bouton-radio (à placer dans un `role="radiogroup"`). */
export function Choice({ selected, onClick, children, className = '', disabled }: ChoiceProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`border-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] disabled:opacity-40 disabled:cursor-not-allowed ${
        selected ? 'border-[#2f9a2d] bg-[#4BC449]/10' : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* --------------------------------- checkbox ------------------------------- */

interface CheckRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  describedBy?: string;
  invalid?: boolean;
}

export function CheckRow({ checked, onChange, children, describedBy, invalid }: CheckRowProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-1.5 group">
      <input
        type="checkbox"
        checked={checked}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4BC449] ${
          checked ? 'bg-[#27802a] border-[#27802a]' : invalid ? 'border-red-400' : 'border-gray-300 group-hover:border-gray-400'
        }`}
      >
        {checked && <IconCheck size={13} className="text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm text-gray-700 leading-snug">{children}</span>
    </label>
  );
}

/* --------------------------------- text field ----------------------------- */

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  name?: string;
  optional?: boolean;
  multiline?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  name,
  optional,
  multiline,
}: TextFieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const cls = `w-full px-4 py-3 rounded-xl bg-gray-50 border text-base sm:text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
    error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-[#4BC449]/25 focus:border-[#4BC449]'
  }`;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-gray-600 mb-1 block">
        {label}
        {optional && <span className="text-gray-500 font-normal"> (optionnel)</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={2}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cls}
        />
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
