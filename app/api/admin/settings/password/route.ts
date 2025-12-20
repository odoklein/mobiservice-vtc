import { NextResponse } from 'next/server';
import { getAdminFromRequest, hashPassword, verifyPassword } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request) {
    try {
        // Verify admin is authenticated
        const admin = await getAdminFromRequest();
        if (!admin) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            );
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 8 caractères' },
                { status: 400 }
            );
        }

        if (!/[A-Z]/.test(newPassword)) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins une majuscule' },
                { status: 400 }
            );
        }

        if (!/[a-z]/.test(newPassword)) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins une minuscule' },
                { status: 400 }
            );
        }

        if (!/[0-9]/.test(newPassword)) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins un chiffre' },
                { status: 400 }
            );
        }

        // Get admin user from database
        const [adminUser] = await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.id, admin.adminId))
            .limit(1);

        if (!adminUser) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Verify current password
        const isValidPassword = await verifyPassword(currentPassword, adminUser.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Mot de passe actuel incorrect' },
                { status: 400 }
            );
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password in database
        await db
            .update(adminUsers)
            .set({
                passwordHash: newPasswordHash,
                updatedAt: new Date(),
            })
            .where(eq(adminUsers.id, admin.adminId));

        return NextResponse.json({
            success: true,
            message: 'Mot de passe modifié avec succès',
        });
    } catch (error) {
        console.error('[PASSWORD UPDATE ERROR]', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}



