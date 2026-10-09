/**
 * French Public Holidays Detection
 * Used to determine night rate pricing (20h-7h + Sundays + Holidays)
 *
 * Fixed holidays work for every year. Easter-based holidays (Lundi de Pâques, Ascension,
 * Lundi de Pentecôte) are computed from the date of Easter, so they are correct for any year.
 */

export interface Holiday {
    date: string; // MM-DD format
    name: string;
}

/**
 * Fixed French public holidays (same date every year)
 */
const FIXED_HOLIDAYS: Holiday[] = [
    { date: '01-01', name: 'Nouvel An' },
    { date: '05-01', name: 'Fête du Travail' },
    { date: '05-08', name: 'Victoire 1945' },
    { date: '07-14', name: 'Fête Nationale' },
    { date: '08-15', name: 'Assomption' },
    { date: '11-01', name: 'Toussaint' },
    { date: '11-11', name: 'Armistice 1918' },
    { date: '12-25', name: 'Noël' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Date of Easter Sunday (Gregorian calendar), "Meeus/Jones/Butcher" algorithm.
 * Returns month (1-12) and day.
 */
export function getEasterSunday(year: number): { month: number; day: number } {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month, day };
}

/** MM-DD of Easter Sunday + `offsetDays` (calendar arithmetic done in UTC: no DST or timezone effect). */
function easterOffsetToMMDD(year: number, offsetDays: number): string {
    const { month, day } = getEasterSunday(year);
    const d = new Date(Date.UTC(year, month - 1, day + offsetDays));
    return `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/**
 * Get Easter-based holidays for a specific year (any year)
 */
function getEasterHolidays(year: number): Holiday[] {
    return [
        { date: easterOffsetToMMDD(year, 1), name: 'Lundi de Pâques' },
        { date: easterOffsetToMMDD(year, 39), name: 'Ascension' },
        { date: easterOffsetToMMDD(year, 50), name: 'Lundi de Pentecôte' },
    ];
}

const toMMDD = (date: Date) => `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/**
 * Check if a given date is a French public holiday
 */
export function isFrenchHoliday(date: Date): boolean {
    return getHolidayName(date) !== null;
}

/**
 * Get the name of a holiday if the date is a French public holiday
 */
export function getHolidayName(date: Date): string | null {
    const dateStr = toMMDD(date);

    const fixedHoliday = FIXED_HOLIDAYS.find((h) => h.date === dateStr);
    if (fixedHoliday) return fixedHoliday.name;

    const easterHoliday = getEasterHolidays(date.getFullYear()).find((h) => h.date === dateStr);
    return easterHoliday ? easterHoliday.name : null;
}

/**
 * Get all holidays for a given year
 */
export function getHolidaysForYear(year: number): Holiday[] {
    return [...FIXED_HOLIDAYS, ...getEasterHolidays(year)];
}
