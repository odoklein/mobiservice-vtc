import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth/admin';
import {
    DEFAULT_DEPOT,
    getStoredDepot,
    parseDepotLocation,
    saveDepot,
} from '@/lib/settings/depot-settings';

export async function GET() {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const stored = await getStoredDepot();

        return NextResponse.json({
            success: true,
            depot: stored ?? DEFAULT_DEPOT,
            isDefault: !stored,
        });
    } catch (error) {
        console.error('Error fetching depot settings:', error);
        return NextResponse.json(
            { message: 'Impossible de charger le dépôt enregistré' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Format invalide' }, { status: 400 });
    }

    const depot = parseDepotLocation(body);
    if (!depot) {
        return NextResponse.json(
            { message: 'Adresse ou coordonnées GPS invalides (latitude entre -90 et 90, longitude entre -180 et 180)' },
            { status: 400 }
        );
    }

    try {
        await saveDepot(depot);

        return NextResponse.json({
            success: true,
            message: 'Dépôt mis à jour',
            depot,
        });
    } catch (error) {
        console.error('Error updating depot settings:', error);
        return NextResponse.json(
            { message: 'Erreur serveur lors de l\'enregistrement du dépôt' },
            { status: 500 }
        );
    }
}
