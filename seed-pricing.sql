-- ============================================================================
-- Seed pricing_rules table with current pricing values
-- Run this SQL script to populate the database with initial pricing configuration
-- ============================================================================

-- Clear existing rules (optional - uncomment if you want to reset)
-- DELETE FROM pricing_rules;

-- ============================================================================
-- FORFAITS (Hourly Packages) - Day Rates
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, forfait_hours, forfait_max_km, hourly_rate_ttc, description, is_active, created_at, updated_at) VALUES
('forfait', 'hourly', 'day', '210.91', '232.00', 2, 180, '116.00', 'Forfait 2H / 180km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '263.64', '290.00', 2.5, 225, '116.00', 'Forfait 2.5H / 225km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '316.36', '348.00', 3, 270, '116.00', 'Forfait 3H / 270km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '369.09', '406.00', 3.5, 315, '116.00', 'Forfait 3.5H / 315km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '421.82', '464.00', 4, 360, '116.00', 'Forfait 4H / 360km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '474.55', '522.00', 4.5, 405, '116.00', 'Forfait 4.5H / 405km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '527.27', '580.00', 5, 450, '116.00', 'Forfait 5H / 450km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '580.00', '638.00', 5.5, 495, '116.00', 'Forfait 5.5H / 495km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '600.00', '660.00', 6, 540, '110.00', 'Forfait 6H / 540km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '650.00', '715.00', 6.5, 585, '110.00', 'Forfait 6.5H / 585km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '668.18', '735.00', 7, 630, '105.00', 'Forfait 7H / 630km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '715.91', '787.50', 7.5, 675, '105.00', 'Forfait 7.5H / 675km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '763.64', '840.00', 8, 720, '105.00', 'Forfait 8H / 720km (Jour)', true, NOW(), NOW());

-- ============================================================================
-- FORFAITS (Hourly Packages) - Night Rates
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, forfait_hours, forfait_max_km, hourly_rate_ttc, description, is_active, created_at, updated_at) VALUES
('forfait', 'hourly', 'night', '254.55', '280.00', 2, 180, '140.00', 'Forfait 2H / 180km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '306.82', '337.50', 2.5, 225, '135.00', 'Forfait 2.5H / 225km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '354.55', '390.00', 3, 270, '130.00', 'Forfait 3H / 270km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '413.64', '455.00', 3.5, 315, '130.00', 'Forfait 3.5H / 315km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '472.73', '520.00', 4, 360, '130.00', 'Forfait 4H / 360km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '531.82', '585.00', 4.5, 405, '130.00', 'Forfait 4.5H / 405km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '590.91', '650.00', 5, 450, '130.00', 'Forfait 5H / 450km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '650.00', '715.00', 5.5, 495, '130.00', 'Forfait 5.5H / 495km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '681.82', '750.00', 6, 540, '125.00', 'Forfait 6H / 540km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '738.64', '812.50', 6.5, 585, '125.00', 'Forfait 6.5H / 585km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '763.64', '840.00', 7, 630, '120.00', 'Forfait 7H / 630km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '818.18', '900.00', 7.5, 675, '120.00', 'Forfait 7.5H / 675km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '872.73', '960.00', 8, 720, '120.00', 'Forfait 8H / 720km (Nuit)', true, NOW(), NOW());

-- ============================================================================
-- PER-KM RATES - TP (Transfer Point) - Constant rate
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, per_km, zone_type, description, is_active, created_at, updated_at) VALUES
('per_km', 'transfer', 'day', '1.20', '1.32', '1.32', 'tp', 'Tarif TP (Jour) - Prix constant au km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.73', '1.90', '1.90', 'tp', 'Tarif TP (Nuit) - Prix constant au km', true, NOW(), NOW());

-- ============================================================================
-- PER-KM RATES - CA (Course d'Approche) - Tiered brackets - Day
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, per_km, zone_type, max_km, description, is_active, created_at, updated_at) VALUES
('per_km', 'transfer', 'day', '1.20', '1.32', '1.32', 'ca', 25, 'Tarif CA (Jour) - 0-25km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '1.20', '1.32', '1.32', 'ca', 50, 'Tarif CA (Jour) - 25-50km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '1.00', '1.10', '1.10', 'ca', 75, 'Tarif CA (Jour) - 50-75km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '0.82', '0.90', '0.90', 'ca', 100, 'Tarif CA (Jour) - 75-100km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '0.64', '0.70', '0.70', 'ca', NULL, 'Tarif CA (Jour) - 100+km', true, NOW(), NOW());

-- ============================================================================
-- PER-KM RATES - CA (Course d'Approche) - Tiered brackets - Night
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, per_km, zone_type, max_km, description, is_active, created_at, updated_at) VALUES
('per_km', 'transfer', 'night', '1.73', '1.90', '1.90', 'ca', 25, 'Tarif CA (Nuit) - 0-25km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.55', '1.70', '1.70', 'ca', 50, 'Tarif CA (Nuit) - 25-50km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.27', '1.40', '1.40', 'ca', 75, 'Tarif CA (Nuit) - 50-75km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.00', '1.10', '1.10', 'ca', 100, 'Tarif CA (Nuit) - 75-100km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '0.64', '0.70', '0.70', 'ca', NULL, 'Tarif CA (Nuit) - 100+km', true, NOW(), NOW());

-- ============================================================================
-- FORFAIT AGGLOMERATION (≤25km A/R)
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, max_km, description, is_active, created_at, updated_at) VALUES
('forfait', 'agglomeration', 'day', '30.00', '33.00', 25, 'Forfait agglomération (Jour) - ≤25km A/R', true, NOW(), NOW()),
('forfait', 'agglomeration', 'night', '43.18', '47.50', 25, 'Forfait agglomération (Nuit) - ≤25km A/R', true, NOW(), NOW());

-- ============================================================================
-- MDA (Mise à Disposition) - Per minute rates
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, per_minute, description, is_active, created_at, updated_at) VALUES
('mda', 'mda', 'day', '1.09', '1.20', '1.20', 'MDA (Jour) - Par minute après 10 min gratuites', true, NOW(), NOW()),
('mda', 'mda', 'night', '1.64', '1.80', '1.80', 'MDA (Nuit) - Par minute après 10 min gratuites', true, NOW(), NOW());

-- ============================================================================
-- AIRPORT RATES
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, description, is_active, created_at, updated_at) VALUES
('airport', 'airport', 'day', '105.45', '116.00', 'Aéroport Genève (Jour)', true, NOW(), NOW()),
('airport', 'airport', 'night', '118.18', '130.00', 'Aéroport Genève (Nuit)', true, NOW(), NOW()),
('airport', 'airport', 'day', '210.91', '232.00', 'Aéroport Lyon-Saint Exupéry (Jour)', true, NOW(), NOW()),
('airport', 'airport', 'night', '236.36', '260.00', 'Aéroport Lyon-Saint Exupéry (Nuit)', true, NOW(), NOW());

-- ============================================================================
-- EXTRA HOUR RATES (beyond forfait)
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, per_hour, description, is_active, created_at, updated_at) VALUES
('extra_hour', 'hourly', 'day', '105.45', '116.00', '116.00', 'Heure supplémentaire (Jour)', true, NOW(), NOW()),
('extra_hour', 'hourly', 'night', '127.27', '140.00', '140.00', 'Heure supplémentaire (Nuit)', true, NOW(), NOW());

-- ============================================================================
-- MINIMUM PRICE
-- ============================================================================
INSERT INTO pricing_rules (rule_type, service_type, time_slot, price_ht, price_ttc, min_price, description, is_active, created_at, updated_at) VALUES
('min_price', 'transfer', 'day', '30.00', '33.00', '33.00', 'Prix minimum (Forfait agglomération jour)', true, NOW(), NOW());

-- ============================================================================
-- Verification query (optional - run to check inserted records)
-- ============================================================================
-- SELECT rule_type, service_type, time_slot, COUNT(*) as count 
-- FROM pricing_rules 
-- WHERE is_active = true 
-- GROUP BY rule_type, service_type, time_slot 
-- ORDER BY rule_type, time_slot;
