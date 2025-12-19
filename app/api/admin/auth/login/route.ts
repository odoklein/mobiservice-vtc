import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateToken, setAdminCookie } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email et mot de passe requis' },
                { status: 400 }
            );
        }

        console.log('[LOGIN] Attempting login for:', email);

        // Find admin user in database
        const [admin] = await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.email, email))
            .limit(1);

        if (!admin) {
            console.log('[LOGIN] Admin not found');
            return NextResponse.json(
                { message: 'Identifiants invalides' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, admin.passwordHash);

        if (!isValidPassword) {
            console.log('[LOGIN] Invalid password');
            return NextResponse.json(
                { message: 'Identifiants invalides' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await generateToken(admin.id, admin.email);
        await setAdminCookie(token);

        console.log('[LOGIN] Login successful for:', admin.email);

        return NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        });
    } catch (error) {
        console.error('[LOGIN] Error details:', error);
        console.error('[LOGIN] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            { message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
