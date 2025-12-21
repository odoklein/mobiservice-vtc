import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, companySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { generateBonDeCommande, generateFacture, generateDevis, generateBonDeReservation, savePDF } from '@/lib/pdf/generator';

async function loadCompanySettings() {
  try {
    const settings = await db.select().from(companySettings);
    const company: any = {};
    const invoice: any = {};

    for (const s of settings) {
      let value: any = s.settingValue;
      if (s.settingType === 'json' && value) {
        try {
          value = JSON.parse(value);
        } catch {}
      } else if (s.settingType === 'number' && value) {
        value = parseFloat(value);
      } else if (s.settingType === 'boolean') {
        value = value === 'true';
      }

      if (s.category === 'company') {
        company[s.settingKey] = value;
      } else if (s.category === 'invoice' || s.category === 'quote') {
        invoice[s.settingKey] = value;
      }
    }

    return { company, invoice };
  } catch (error) {
    console.error('Error loading company settings:', error);
    return { company: {}, invoice: {} };
  }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const bookingId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'bon', 'facture', 'devis', or 'bdr'

        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        // Load company and invoice settings
        const { company, invoice } = await loadCompanySettings();

        let htmlContent: string;
        let filename: string;

        if (type === 'bon') {
            htmlContent = await generateBonDeCommande(booking);
            filename = `bon-commande-${bookingId}`;
        } else if (type === 'facture') {
            htmlContent = await generateFacture(booking, company, invoice);
            filename = `facture-${bookingId}`;
        } else if (type === 'devis') {
            htmlContent = await generateDevis(booking, company, invoice);
            filename = `devis-${bookingId}`;
        } else if (type === 'bdr') {
            htmlContent = await generateBonDeReservation(booking);
            filename = `bdr-${bookingId}`;
        } else {
            return NextResponse.json(
                { message: 'Type invalide (bon, facture, devis ou bdr)' },
                { status: 400 }
            );
        }

        const pdfResult = await savePDF(htmlContent, filename);

        // Store HTML content as a data URL that can be opened directly in browser
        // This works in both local and serverless environments
        const htmlDataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(pdfResult.html)}`;

        // Update booking with document info
        await db
            .update(bookings)
            .set({
                documentsPdfPath: htmlDataUrl,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        return NextResponse.json({
            success: true,
            url: htmlDataUrl,
            filename: pdfResult.filename,
            message: 'Document généré avec succès',
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
            { message: 'Erreur lors de la génération du PDF' },
            { status: 500 }
        );
    }
}
