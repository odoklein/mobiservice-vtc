import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingRules } from '@/lib/db/schema';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { eq } from 'drizzle-orm';
import { invalidatePricingCache } from '@/lib/services/pricing-service';
import { z } from 'zod';

const pricingRuleUpdateSchema = z.object({
  ruleType: z.enum(['forfait', 'per_km', 'airport', 'mda', 'extra_hour', 'min_price']).optional(),
  serviceType: z.string().optional(),
  timeSlot: z.enum(['day', 'night']).optional(),
  priceHT: z.string().or(z.number()).optional(),
  priceTTC: z.string().or(z.number()).optional(),
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
 * PATCH /api/admin/settings/pricing/[id]
 * Update a single pricing rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ruleId = parseInt(id);

    if (isNaN(ruleId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const validated = pricingRuleUpdateSchema.parse(body);

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validated.ruleType !== undefined) updateData.ruleType = validated.ruleType;
    if (validated.serviceType !== undefined) updateData.serviceType = validated.serviceType || null;
    if (validated.timeSlot !== undefined) updateData.timeSlot = validated.timeSlot;
    if (validated.priceHT !== undefined) updateData.priceHT = validated.priceHT.toString();
    if (validated.priceTTC !== undefined) updateData.priceTTC = validated.priceTTC.toString();
    if (validated.forfaitHours !== undefined) updateData.forfaitHours = validated.forfaitHours || null;
    if (validated.forfaitMaxKm !== undefined) updateData.forfaitMaxKm = validated.forfaitMaxKm || null;
    if (validated.hourlyRateTTC !== undefined) updateData.hourlyRateTTC = validated.hourlyRateTTC?.toString() || null;
    if (validated.zoneType !== undefined) updateData.zoneType = validated.zoneType || null;
    if (validated.maxKm !== undefined) updateData.maxKm = validated.maxKm ?? null;
    if (validated.perKm !== undefined) updateData.perKm = validated.perKm?.toString() || null;
    if (validated.perMinute !== undefined) updateData.perMinute = validated.perMinute?.toString() || null;
    if (validated.perHour !== undefined) updateData.perHour = validated.perHour?.toString() || null;
    if (validated.minPrice !== undefined) updateData.minPrice = validated.minPrice?.toString() || null;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const [updated] = await db
      .update(pricingRules)
      .set(updateData)
      .where(eq(pricingRules.id, ruleId))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: 'Règle introuvable' }, { status: 404 });
    }

    // Invalidate cache
    invalidatePricingCache();

    return NextResponse.json({
      success: true,
      message: 'Règle mise à jour',
      rule: updated,
    });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation échouée', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/settings/pricing/[id]
 * Delete a pricing rule (soft delete by setting isActive=false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ruleId = parseInt(id);

    if (isNaN(ruleId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
    }

    // Soft delete
    const [updated] = await db
      .update(pricingRules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pricingRules.id, ruleId))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: 'Règle introuvable' }, { status: 404 });
    }

    // Invalidate cache
    invalidatePricingCache();

    return NextResponse.json({
      success: true,
      message: 'Règle désactivée',
      rule: updated,
    });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

