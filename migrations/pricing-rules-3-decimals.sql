-- Tarifs au millième : les prix au km sont saisis avec 3 décimales (ex. 1,454 € HT/km).
-- En numeric(10,2), Postgres arrondissait 1,454 → 1,45 et 1,455 → 1,46.
-- Élargir l'échelle ne perd aucune donnée (1.45 devient 1.450).

ALTER TABLE pricing_rules
  ALTER COLUMN price_ht        TYPE numeric(10, 3),
  ALTER COLUMN price_ttc       TYPE numeric(10, 3),
  ALTER COLUMN hourly_rate_ttc TYPE numeric(10, 3),
  ALTER COLUMN base_fare       TYPE numeric(10, 3),
  ALTER COLUMN per_km          TYPE numeric(10, 3),
  ALTER COLUMN per_minute      TYPE numeric(10, 3),
  ALTER COLUMN per_hour        TYPE numeric(10, 3),
  ALTER COLUMN min_price       TYPE numeric(10, 3);
