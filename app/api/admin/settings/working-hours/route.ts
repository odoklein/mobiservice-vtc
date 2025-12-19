import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workingHours } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const hours = await db
            .select()
            .from(workingHours)
            .orderBy(workingHours.dayOfWeek);

        return NextResponse.json({
            success: true,
            hours,
        });
    } catch (error) {
        console.error('Error fetching working hours:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const { hours } = await request.json();

        if (!Array.isArray(hours)) {
            return NextResponse.json(
                { message: 'Format invalide' },
                { status: 400 }
            );
        }

        // Delete existing hours
        await db.delete(workingHours);

        // Insert new hours
        for (const hour of hours) {
            await db.insert(workingHours).values({
                dayOfWeek: hour.dayOfWeek,
                startTime: hour.startTime,
                endTime: hour.endTime,
                isActive: hour.isActive,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Horaires mis à jour',
        });
    } catch (error) {
        console.error('Error updating working hours:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
