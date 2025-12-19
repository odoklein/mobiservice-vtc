/**
 * French Public Holidays Detection
 * Used to determine night rate pricing (20h-7h + Sundays + Holidays)
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

/**
 * Easter-based holidays for 2025
 * Easter 2025 is April 20th
 */
const EASTER_BASED_2025: Holiday[] = [
    { date: '04-21', name: 'Lundi de Pâques' }, // Easter Monday
    { date: '05-29', name: 'Ascension' }, // 39 days after Easter
    { date: '06-09', name: 'Lundi de Pentecôte' }, // 50 days after Easter
];

/**
 * Easter-based holidays for 2026
 * Easter 2026 is April 5th
 */
const EASTER_BASED_2026: Holiday[] = [
    { date: '04-06', name: 'Lundi de Pâques' },
    { date: '05-14', name: 'Ascension' },
    { date: '05-25', name: 'Lundi de Pentecôte' },
];

/**
 * Get Easter-based holidays for a specific year
 */
function getEasterHolidays(year: number): Holiday[] {
    switch (year) {
        case 2025:
            return EASTER_BASED_2025;
        case 2026:
            return EASTER_BASED_2026;
        default:
            // For years beyond 2026, would need to calculate Easter date
            // For now, return empty array (safe fallback - won't incorrectly apply night rate)
            return [];
    }
}

/**
 * Check if a given date is a French public holiday
 */
export function isFrenchHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check fixed holidays
    const isFixedHoliday = FIXED_HOLIDAYS.some(h => h.date === dateStr);
    if (isFixedHoliday) return true;

    // Check Easter-based holidays for the year
    const easterHolidays = getEasterHolidays(year);
    const isEasterHoliday = easterHolidays.some(h => h.date === dateStr);

    return isEasterHoliday;
}

/**
 * Get the name of a holiday if the date is a French public holiday
 */
export function getHolidayName(date: Date): string | null {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check fixed holidays
    const fixedHoliday = FIXED_HOLIDAYS.find(h => h.date === dateStr);
    if (fixedHoliday) return fixedHoliday.name;

    // Check Easter-based holidays
    const easterHolidays = getEasterHolidays(year);
    const easterHoliday = easterHolidays.find(h => h.date === dateStr);
    if (easterHoliday) return easterHoliday.name;

    return null;
}

/**
 * Get all holidays for a given year
 */
export function getHolidaysForYear(year: number): Holiday[] {
    return [...FIXED_HOLIDAYS, ...getEasterHolidays(year)];
}
