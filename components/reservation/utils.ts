import { isFrenchHoliday } from '@/lib/holidays';

export const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
export const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
/** En-têtes de calendrier imposés par le client (Dim. Lun. Mar. …). */
export const WEEKDAY_HEADERS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

export const pad = (n: number) => String(n).padStart(2, '0');
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Nombre de jours calendaires entre deux dates (b - a), insensible à l'heure d'été. */
export const dayDiff = (a: Date, b: Date) =>
  Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatLongDate = (d: Date) =>
  `${capitalize(DAY_NAMES[d.getDay()])} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
export const formatMediumDate = (d: Date) =>
  `${capitalize(DAY_NAMES[d.getDay()]).slice(0, 3)}. ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const monthTitle = (d: Date) => `${capitalize(MONTH_NAMES[d.getMonth()])} ${d.getFullYear()}`;

/**
 * Grille du mois, semaines commençant le dimanche
 * (« Dim. Lun. Mar. Mer. Jeu. Ven. Sam. » — demandé par le client).
 */
export function buildMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks.filter((week) => week.some((d) => d.getMonth() === month));
}

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) for (const m of [0, 30]) slots.push(`${pad(h)}:${pad(m)}`);
  return slots;
})();

export const parseTime = (time: string): [number, number] | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return [h, min];
};

export const combineDateTime = (date: Date, time: string) => {
  const [h, m] = parseTime(time) ?? [0, 0];
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
};

/** Midi local, sérialisé en ISO : même jour calendaire quel que soit le fuseau du serveur. */
export const toNoonISO = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString();

/** Dimanche ou jour férié : tarif de nuit toute la journée. */
export const isNightDay = (d: Date) => d.getDay() === 0 || isFrenchHoliday(d);

/** Règle tarifaire : nuit = 20h–7h, dimanche et jours fériés. */
export const isNightSlot = (day: Date, time: string) => {
  const parsed = parseTime(time);
  if (!parsed) return false;
  return isNightDay(day) || parsed[0] >= 20 || parsed[0] < 7;
};

/** Formate un montant : 1 234,50 € ; supprime les centimes nuls. */
export const formatEuro = (amount: number) => {
  const rounded = Math.round(amount * 100) / 100;
  const hasCents = Math.abs(rounded - Math.round(rounded)) > 0.0001;
  return `${rounded.toLocaleString('fr-FR', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })} €`;
};

export const formatDuration = (minutes: number) => {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} h` : `${h} h ${pad(r)}`;
};

export const formatHours = (hours: number) => {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return Number.isInteger(hours) ? `${hours}h` : `${Math.floor(hours)}h30`;
};
