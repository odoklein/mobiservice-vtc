import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth/admin';

export async function POST(request: Request) {
    try {
        await clearAdminCookie();

        // Get the origin from the request to build absolute URL
        const url = new URL('/admin/login', request.url);
        
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('[LOGOUT ERROR]', error);
        return NextResponse.json(
            { message: 'Erreur lors de la déconnexion' },
            { status: 500 }
        );
    }
}
