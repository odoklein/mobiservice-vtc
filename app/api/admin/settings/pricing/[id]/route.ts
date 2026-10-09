import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingRules } from '@/lib/db/schema';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { eq } from 'drizzle-orm';
import { invalidatePricingCache } from '@/lib/services/pricing-service';
import {
  pricingRuleUpdateSchema,
  toPricingRuleColumns,
  formatPricingRuleError,
} from '@/lib/validations/pricing-rule';
import { z } from 'zod';

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
      ...toPricingRuleColumns(validated),
      updatedAt: new Date(),
    };

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
      return NextResponse.json({ message: formatPricingRuleError(error), errors: error.errors }, { status: 400 });
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

