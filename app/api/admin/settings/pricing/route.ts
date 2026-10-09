import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingRules } from '@/lib/db/schema';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { eq, and } from 'drizzle-orm';
import { invalidatePricingCache } from '@/lib/services/pricing-service';
import {
  pricingRuleSchema,
  toPricingRuleColumns,
  formatPricingRuleError,
} from '@/lib/validations/pricing-rule';
import { z } from 'zod';

/**
 * GET /api/admin/settings/pricing
 * Fetch all pricing rules grouped by type
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const allRules = await db.select().from(pricingRules).orderBy(pricingRules.ruleType, pricingRules.timeSlot);

    // Group by rule type for easier UI consumption
    const grouped = {
      forfaits: allRules.filter((r) => r.ruleType === 'forfait' && r.serviceType === 'hourly'),
      perKm: allRules.filter((r) => r.ruleType === 'per_km'),
      agglomeration: allRules.filter((r) => r.ruleType === 'forfait' && r.serviceType === 'agglomeration'),
      airports: allRules.filter((r) => r.ruleType === 'airport'),
      mda: allRules.filter((r) => r.ruleType === 'mda'),
      extraHour: allRules.filter((r) => r.ruleType === 'extra_hour'),
      minPrice: allRules.filter((r) => r.ruleType === 'min_price'),
    };

    return NextResponse.json({
      success: true,
      rules: allRules,
      grouped,
    });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/pricing
 * Bulk update pricing rules
 */
export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { rules } = await request.json();

    if (!Array.isArray(rules)) {
      return NextResponse.json({ message: 'Format invalide: rules doit être un tableau' }, { status: 400 });
    }

    const updatedRules = [];

    // Validate everything before writing, so a forfait is never half-saved (day without night)
    const validatedRules = rules.map((ruleData) => pricingRuleSchema.parse(ruleData));

    // One hourly forfait per duration and period, otherwise the engine cannot pick one
    for (const validated of validatedRules) {
      if (validated.ruleType !== 'forfait' || validated.serviceType !== 'hourly' || !validated.forfaitHours) continue;
      const clashes = await db
        .select({ id: pricingRules.id })
        .from(pricingRules)
        .where(
          and(
            eq(pricingRules.ruleType, 'forfait'),
            eq(pricingRules.serviceType, 'hourly'),
            eq(pricingRules.timeSlot, validated.timeSlot),
            eq(pricingRules.forfaitHours, validated.forfaitHours),
            eq(pricingRules.isActive, true)
          )
        );
      if (clashes.some((r: { id: number }) => r.id !== validated.id)) {
        return NextResponse.json(
          { message: `Un forfait de ${String(validated.forfaitHours).replace('.', ',')} h existe déjà` },
          { status: 400 }
        );
      }
    }

    for (const validated of validatedRules) {
      const columns: any = { ...toPricingRuleColumns(validated), isActive: validated.isActive ?? true };

      if (validated.id) {
        // Update existing
        const [updated] = await db
          .update(pricingRules)
          .set({ ...columns, updatedAt: new Date() })
          .where(eq(pricingRules.id, validated.id))
          .returning();

        if (updated) {
          updatedRules.push(updated);
        }
      } else {
        // Create new
        const [created] = await db.insert(pricingRules).values(columns).returning();

        if (created) {
          updatedRules.push(created);
        }
      }
    }

    // Invalidate cache
    invalidatePricingCache();

    return NextResponse.json({
      success: true,
      message: `${updatedRules.length} règle(s) mise(s) à jour`,
      rules: updatedRules,
    });
  } catch (error) {
    console.error('Error updating pricing rules:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: formatPricingRuleError(error), errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/pricing?action=reset
 * Reset pricing rules to default values
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
      // Delete + re-seed in one transaction: if the insert fails, the current rules are kept
      const { buildDefaultPricingRules } = await import('@/lib/db/seed-pricing');
      const defaults = buildDefaultPricingRules();
      await db.batch([db.delete(pricingRules), db.insert(pricingRules).values(defaults)]);

      // Invalidate cache
      invalidatePricingCache();

      return NextResponse.json({
        success: true,
        message: 'Tarification réinitialisée aux valeurs par défaut',
        count: defaults.length,
      });
    }

    return NextResponse.json({ message: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error resetting pricing:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

