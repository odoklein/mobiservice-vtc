import { db } from '@/lib/db';
import { workingHours, exceptions } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Check if a given date/time is within working hours
 */
export async function isTimeAvailable(date: Date, time: string): Promise<boolean> {
    const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)

    // Check for exception days first
    const dateStr = date.toISOString().split('T')[0];
    const [exception] = await db
        .select()
        .from(exceptions)
        .where(
            and(
                gte(exceptions.date, new Date(dateStr)),
                lte(exceptions.date, new Date(dateStr + 'T23:59:59'))
            )
        )
        .limit(1);

    if (exception && exception.isClosed) {
        return false;
    }

    // Check regular working hours
    const [schedule] = await db
        .select()
        .from(working Hours)
        .where(eq(workingHours.dayOfWeek, dayOfWeek))
        .limit(1);

    if (!schedule || !schedule.isActive) {
        return false;
    }

    // Check if time is within range
    const requestTime = time.replace(':', '');
    const startTime = schedule.startTime.replace(':', '');
    const endTime = schedule.endTime.replace(':', '');

    return requestTime >= startTime && requestTime <= endTime;
}

/**
 * Get available time slots for a given date
 */
export async function getAvailableSlots(date: Date): Promise<string[]> {
    const slots: string[] = [];

    const dayOfWeek = date.getDay();

    const [schedule] = await db
        .select()
        .from(workingHours)
        .where(eq(workingHours.dayOfWeek, dayOfWeek))
        .limit(1);

    if (!schedule || !schedule.isActive) {
        return slots;
    }

    // Generate 30-minute slots
    const startHour = parseInt(schedule.startTime.split(':')[0]);
    const startMinute = parseInt(schedule.startTime.split(':')[1]);
    const endHour = parseInt(schedule.endTime.split(':')[0]);
    const endMinute = parseInt(schedule.endTime.split(':')[1]);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute <= endMinute)
    ) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute
            .toString()
            .padStart(2, '0')}`;
        slots.push(timeString);

        currentMinute += 30;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
        }
    }

    return slots;
}
