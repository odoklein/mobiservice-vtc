import { db } from '@/lib/db';
import { companySettings } from '@/lib/db/schema';

/**
 * Interface pour les paramètres de l'entreprise
 */
export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  siret: string;
  tva: string;
  phone: string;
  email: string;
  website?: string;
  bankDetails?: string;
  iban?: string;
  bic?: string;
  paymentTerms?: string;
  footerText?: string;
  logoUrl?: string;
}

/**
 * Interface pour les paramètres de facturation/devis
 */
export interface InvoiceSettings {
  invoicePrefix: string;
  quotePrefix: string;
  quoteValidityDays: number;
  defaultPaymentTerms: string;
  showDetailedBreakdown: boolean;
  showDistanceSegments: boolean;
  showQRCode?: boolean;
  qrCodeData?: string;
  termsAndConditions?: string;
}

/**
 * Valeurs par défaut pour les paramètres de l'entreprise
 */
const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'MobiService VTC',
  address: '4 rue des artisans',
  city: 'Cluses',
  postalCode: '74300',
  siret: 'XXX XXX XXX XXXXX',
  tva: 'FRXX XXX XXX XXX',
  phone: '+33 (0)6 07 72 50 07',
  email: 'contact@mobiservice-vtc.fr',
  website: 'www.mobiservice-vtc.fr',
  paymentTerms: 'Paiement à réception de facture',
  footerText: 'MobiService VTC - Transport premium en Haute-Savoie',
};

/**
 * Valeurs par défaut pour les paramètres de facturation
 */
const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  invoicePrefix: 'INV',
  quotePrefix: 'DEV',
  quoteValidityDays: 30,
  defaultPaymentTerms: 'Paiement à réception',
  showDetailedBreakdown: true,
  showDistanceSegments: true,
  showQRCode: false,
};

/**
 * Récupère les paramètres de l'entreprise depuis la base de données
 * Retourne les valeurs par défaut si aucune configuration n'existe
 * 
 * @returns Les paramètres de l'entreprise
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const allSettings = await db.select().from(companySettings);

    const settings: Partial<CompanySettings> = {};

    for (const setting of allSettings) {
      if (setting.category === 'company') {
        let value: any = setting.settingValue;

        // Parse selon le type
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

        // Mapper les clés
        (settings as any)[setting.settingKey] = value;
      }
    }

    // Fusionner avec les valeurs par défaut
    return {
      ...DEFAULT_COMPANY_SETTINGS,
      ...settings,
    };

  } catch (error) {
    console.error('[Settings] Erreur lors de la récupération des paramètres entreprise:', error);
    // Retourner les valeurs par défaut en cas d'erreur
    return DEFAULT_COMPANY_SETTINGS;
  }
}

/**
 * Récupère les paramètres de facturation/devis depuis la base de données
 * Retourne les valeurs par défaut si aucune configuration n'existe
 * 
 * @returns Les paramètres de facturation
 */
export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  try {
    const allSettings = await db.select().from(companySettings);

    const settings: Partial<InvoiceSettings> = {};

    for (const setting of allSettings) {
      if (setting.category === 'invoice' || setting.category === 'quote') {
        let value: any = setting.settingValue;

        // Parse selon le type
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

        // Mapper les clés
        (settings as any)[setting.settingKey] = value;
      }
    }

    // Fusionner avec les valeurs par défaut
    return {
      ...DEFAULT_INVOICE_SETTINGS,
      ...settings,
    };

  } catch (error) {
    console.error('[Settings] Erreur lors de la récupération des paramètres facturation:', error);
    // Retourner les valeurs par défaut en cas d'erreur
    return DEFAULT_INVOICE_SETTINGS;
  }
}

/**
 * Récupère tous les paramètres (entreprise + facturation) en une seule fois
 * Optimisé pour réduire les appels à la base de données
 * 
 * @returns Objet contenant les deux types de paramètres
 */
export async function getAllSettings(): Promise<{
  company: CompanySettings;
  invoice: InvoiceSettings;
}> {
  try {
    const allSettings = await db.select().from(companySettings);

    const companyData: Partial<CompanySettings> = {};
    const invoiceData: Partial<InvoiceSettings> = {};

    for (const setting of allSettings) {
      let value: any = setting.settingValue;

      // Parse selon le type
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

      // Dispatcher selon la catégorie
      if (setting.category === 'company') {
        (companyData as any)[setting.settingKey] = value;
      } else if (setting.category === 'invoice' || setting.category === 'quote') {
        (invoiceData as any)[setting.settingKey] = value;
      }
    }

    return {
      company: { ...DEFAULT_COMPANY_SETTINGS, ...companyData },
      invoice: { ...DEFAULT_INVOICE_SETTINGS, ...invoiceData },
    };

  } catch (error) {
    console.error('[Settings] Erreur lors de la récupération des paramètres:', error);
    return {
      company: DEFAULT_COMPANY_SETTINGS,
      invoice: DEFAULT_INVOICE_SETTINGS,
    };
  }
}

/**
 * Récupère un paramètre spécifique par sa clé
 * 
 * @param key - La clé du paramètre
 * @returns La valeur du paramètre ou null si non trouvé
 */
export async function getSetting(key: string): Promise<any> {
  try {
    const allSettings = await db.select().from(companySettings);
    const setting = allSettings.find(s => s.settingKey === key);

    if (!setting) {
      return null;
    }

    let value: any = setting.settingValue;

    // Parse selon le type
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

    return value;

  } catch (error) {
    console.error(`[Settings] Erreur lors de la récupération du paramètre ${key}:`, error);
    return null;
  }
}


