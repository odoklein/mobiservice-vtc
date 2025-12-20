import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companySettings } from '@/lib/db/schema';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const allSettings = await db.select().from(companySettings);

    // Group settings by category
    const grouped: any = {
      companySettings: {},
      invoiceSettings: {},
    };

    for (const setting of allSettings) {
      let value: any = setting.settingValue;
      
      // Parse based on type
      if (setting.settingType === 'json' && value) {
        try {
          value = JSON.parse(value);
        } catch {
          value = setting.settingValue;
        }
      } else if (setting.settingType === 'number' && value) {
        value = parseFloat(value);
      } else if (setting.settingType === 'boolean') {
        value = value === 'true';
      }

      if (setting.category === 'company') {
        grouped.companySettings[setting.settingKey] = value;
      } else if (setting.category === 'invoice' || setting.category === 'quote') {
        grouped.invoiceSettings[setting.settingKey] = value;
      }
    }

    return NextResponse.json({
      success: true,
      ...grouped,
    });
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { companySettings: companyData, invoiceSettings: invoiceData } = await request.json();

    const settingsToUpdate: Array<{ key: string; value: any; type: string; category: string }> = [];

    // Company settings
    if (companyData) {
      for (const [key, value] of Object.entries(companyData)) {
        settingsToUpdate.push({
          key,
          value: String(value),
          type: 'text',
          category: 'company',
        });
      }
    }

    // Invoice settings
    if (invoiceData) {
      for (const [key, value] of Object.entries(invoiceData)) {
        const type = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text';
        settingsToUpdate.push({
          key,
          value: String(value),
          type,
          category: key.includes('quote') ? 'quote' : 'invoice',
        });
      }
    }

    // Upsert settings
    for (const setting of settingsToUpdate) {
      await db
        .insert(companySettings)
        .values({
          settingKey: setting.key,
          settingValue: setting.value,
          settingType: setting.type,
          category: setting.category,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: companySettings.settingKey,
          set: {
            settingValue: setting.value,
            updatedAt: new Date(),
          },
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Paramètres enregistrés',
    });
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

