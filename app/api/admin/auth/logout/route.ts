import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth/admin';

export async function POST() {
    try {
        await clearAdminCookie();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { message: 'Erreur lors de la déconnexion' },
            { status: 500 }
        );
    }
}
