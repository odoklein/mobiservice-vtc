import { z } from 'zod';

/**
 * Validation des règles tarifaires éditées dans l'admin (Paramètres > Tarification).
 *
 * L'admin renvoie la ligne complète lue en base : les colonnes inutilisées valent null,
 * les décimales Postgres arrivent en string ("1.32") et un champ vidé arrive en "".
 */

// "" → null, "1,80" → 1.8, "abc" → NaN (refusé par z.number)
const toNumber = (v: unknown) => {
  if (typeof v !== 'string') return v;
  const s = v.trim().replace(',', '.');
  return s === '' ? null : Number(s);
};
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const amount = (label: string) =>
  z.preprocess(
    toNumber,
    z.number({ invalid_type_error: `${label} : montant invalide` }).min(0, `${label} : doit être positif`).nullish()
  );

const requiredAmount = (label: string) =>
  z.preprocess(
    toNumber,
    z.number({ required_error: `${label} : requis`, invalid_type_error: `${label} : montant invalide` })
      .min(0, `${label} : doit être positif`)
  );

const wholeNumber = (label: string) =>
  z.preprocess(
    toNumber,
    z.number({ invalid_type_error: `${label} : nombre invalide` })
      .int(`${label} : nombre entier attendu`)
      .min(0, `${label} : doit être positif`)
      .nullish()
  );

const text = z.preprocess(blankToNull, z.string().nullish());

const ruleType = z.enum(['forfait', 'per_km', 'airport', 'mda', 'extra_hour', 'min_price']);
const timeSlot = z.enum(['day', 'night'], { errorMap: () => ({ message: 'Période : jour ou nuit' }) });

const optionalFields = {
  serviceType: text,
  forfaitHours: z.preprocess(
    toNumber,
    z.number({ invalid_type_error: 'Heures : nombre invalide' })
      .positive('Heures : doit être positif')
      .multipleOf(0.5, 'Heures : par demi-heure (ex. 2.5)')
      .nullish()
  ),
  forfaitMaxKm: wholeNumber('Max km'),
  hourlyRateTTC: amount('Taux horaire'),
  zoneType: text,
  maxKm: wholeNumber('Tranche (km)'),
  perKm: amount('Prix/km'),
  perMinute: amount('Prix/minute'),
  perHour: amount('Prix/heure'),
  minPrice: amount('Prix minimum'),
  description: text,
  isActive: z.boolean().nullish(),
};

/** Création / mise à jour complète (PUT). */
export const pricingRuleSchema = z.object({
  id: z.number().int().positive().nullish(),
  ruleType,
  timeSlot,
  priceHT: requiredAmount('Prix HT'),
  priceTTC: requiredAmount('Prix TTC'),
  ...optionalFields,
});

/** Mise à jour partielle (PATCH) : seuls les champs présents sont modifiés. */
export const pricingRuleUpdateSchema = z.object({
  ruleType: ruleType.nullish(),
  timeSlot: timeSlot.nullish(),
  priceHT: requiredAmount('Prix HT').optional(),
  priceTTC: requiredAmount('Prix TTC').optional(),
  ...optionalFields,
});

type PricingRuleInput = z.infer<typeof pricingRuleUpdateSchema>;

const DECIMAL_COLUMNS = ['priceHT', 'priceTTC', 'hourlyRateTTC', 'perKm', 'perMinute', 'perHour', 'minPrice'];
const NOT_NULL_COLUMNS = ['ruleType', 'timeSlot', 'isActive'];

/**
 * Convertit une saisie validée en colonnes Drizzle : décimales en string,
 * champs absents ignorés, null ignoré pour les colonnes NOT NULL.
 */
export function toPricingRuleColumns(input: PricingRuleInput): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'id' || value === undefined) continue;
    if (value === null) {
      if (!NOT_NULL_COLUMNS.includes(key)) columns[key] = null;
      continue;
    }
    columns[key] = DECIMAL_COLUMNS.includes(key) ? (value as number).toFixed(2) : value;
  }
  return columns;
}

/** Message lisible pour l'admin à partir d'une erreur de validation. */
export function formatPricingRuleError(error: z.ZodError): string {
  return `Validation échouée : ${[...new Set(error.issues.map((i) => i.message))].join(' · ')}`;
}
