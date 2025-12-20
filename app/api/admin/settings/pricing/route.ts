import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingRules } from '@/lib/db/schema';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { eq, and } from 'drizzle-orm';
import { invalidatePricingCache } from '@/lib/services/pricing-service';
import { z } from 'zod';

const TVA_RATE = 0.10;

// Validation schema for pricing rule
const pricingRuleSchema = z.object({
  id: z.number().optional(),
  ruleType: z.enum(['forfait', 'per_km', 'airport', 'mda', 'extra_hour', 'min_price']),
  serviceType: z.string().optional(),
  timeSlot: z.enum(['day', 'night']),
  priceHT: z.string().or(z.number()),
  priceTTC: z.string().or(z.number()),
  forfaitHours: z.number().optional(),
  forfaitMaxKm: z.number().optional(),
  hourlyRateTTC: z.string().or(z.number()).optional(),
  zoneType: z.string().optional(),
  maxKm: z.number().nullable().optional(),
  perKm: z.string().or(z.number()).optional(),
  perMinute: z.string().or(z.number()).optional(),
  perHour: z.string().or(z.number()).optional(),
  minPrice: z.string().or(z.number()).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

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

    for (const ruleData of rules) {
      // Validate
      const validated = pricingRuleSchema.parse(ruleData);

      if (validated.id) {
        // Update existing
        const [updated] = await db
          .update(pricingRules)
          .set({
            ruleType: validated.ruleType,
            serviceType: validated.serviceType || null,
            timeSlot: validated.timeSlot,
            priceHT: validated.priceHT.toString(),
            priceTTC: validated.priceTTC.toString(),
            forfaitHours: validated.forfaitHours || null,
            forfaitMaxKm: validated.forfaitMaxKm || null,
            hourlyRateTTC: validated.hourlyRateTTC?.toString() || null,
            zoneType: validated.zoneType || null,
            maxKm: validated.maxKm ?? null,
            perKm: validated.perKm?.toString() || null,
            perMinute: validated.perMinute?.toString() || null,
            perHour: validated.perHour?.toString() || null,
            minPrice: validated.minPrice?.toString() || null,
            description: validated.description || null,
            isActive: validated.isActive ?? true,
            updatedAt: new Date(),
          })
          .where(eq(pricingRules.id, validated.id))
          .returning();

        if (updated) {
          updatedRules.push(updated);
        }
      } else {
        // Create new
        const [created] = await db
          .insert(pricingRules)
          .values({
            ruleType: validated.ruleType,
            serviceType: validated.serviceType || null,
            timeSlot: validated.timeSlot,
            priceHT: validated.priceHT.toString(),
            priceTTC: validated.priceTTC.toString(),
            forfaitHours: validated.forfaitHours || null,
            forfaitMaxKm: validated.forfaitMaxKm || null,
            hourlyRateTTC: validated.hourlyRateTTC?.toString() || null,
            zoneType: validated.zoneType || null,
            maxKm: validated.maxKm ?? null,
            perKm: validated.perKm?.toString() || null,
            perMinute: validated.perMinute?.toString() || null,
            perHour: validated.perHour?.toString() || null,
            minPrice: validated.minPrice?.toString() || null,
            description: validated.description || null,
            isActive: validated.isActive ?? true,
          })
          .returning();

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
      return NextResponse.json({ message: 'Validation échouée', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/pricing/reset
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
      // Delete all existing rules
      await db.delete(pricingRules);

      // Re-seed from seed script
      const { seedPricingRules } = await import('@/lib/db/seed-pricing');
      const result = await seedPricingRules();

      // Invalidate cache
      invalidatePricingCache();

      return NextResponse.json({
        success: true,
        message: 'Tarification réinitialisée aux valeurs par défaut',
        count: result.count,
      });
    }

    return NextResponse.json({ message: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error resetting pricing:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

