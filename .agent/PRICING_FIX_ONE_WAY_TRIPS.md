# Pricing Fix: One-Way Trips (Aller Simple)

## Issue Description
The displayed price and invoiced price weren't matching for one-way trips because the return distance (dropoff → depot, without client) was potentially being included in calculations or not clearly communicated.

## Root Cause
For **Aller Simple (A/S)** trips, the tariff structure is:
- ✅ **CA_out** (depot → pickup): Client pays - VTC must reach them
- ✅ **TP** (pickup → dropoff): Client pays - main transport segment
- ❌ **CA_return** (dropoff → depot): **Client does NOT pay** - empty return

The system was correctly calculating this in most cases, but there were potential edge cases and the invoices weren't clearly showing the trip type.

## Changes Made

### 1. Invoice Generation (`lib/pdf/generator.ts`)
**Changes:**
- ✅ Added **trip type indicator** (A/S vs A/R) on all invoices
- ✅ Display "Distance trajet avec client" instead of total distance
- ✅ Added clarifying note for one-way trips: _"Tarif A/S n'inclut pas le retour à vide du véhicule"_
- ✅ Use `totalPriceHT` and `totalPriceTTC` fields (more accurate than legacy fields)
- ✅ Added `generateDevis()` and `generateBonDeReservation()` functions

**Before:**
```html
<small>Distance: ${booking.distance} km</small>
```

**After:**
```html
<small>Distance trajet avec client: ${booking.distanceTP} km</small>
${booking.tripType === 'one-way' ? '<br><small><em>Note: Tarif A/S n\'inclut pas le retour à vide du véhicule</em></small>' : ''}
```

### 2. Pricing Estimation API (`app/api/pricing/estimate/route.ts`)
**Changes:**
- ✅ Added defensive logging when one-way trips calculate return distance
- ✅ Added comments clarifying that `distanceCA_return` is 0 for one-way
- ✅ Ensured response clearly indicates when `ca_return` is 0

```typescript
// CRITICAL: For one-way trips, return distance is 0 (client doesn't pay for empty return)
distanceCA_return = tripType === 'round-trip' ? segments.distanceReturn : 0;

if (tripType === 'one-way' && segments.distanceReturn > 0) {
  console.log(`[PRICING] One-way trip: distanceReturn=${segments.distanceReturn}km calculated but NOT charged`);
}
```

### 3. Pricing Calculation (`lib/pricing/tariffs-2026.ts`)
**Changes:**
- ✅ Added safeguard to force `distanceCA_return = 0` for one-way trips
- ✅ Added warning log if incorrect value is passed

```typescript
// CRITICAL: For one-way trips, force distanceCA_return to 0
if (tripType === 'one-way' && distanceCA_return !== 0) {
  console.warn(`[PRICING] One-way trip has non-zero distanceCA_return=${distanceCA_return}, forcing to 0`);
  distanceCA_return = 0;
}
```

### 4. Booking Creation (`app/api/bookings/route.ts`)
**Changes:**
- ✅ Added validation to ensure `distanceReturn` is 0 for one-way bookings
- ✅ Logs warning if incorrect data is received

```typescript
if (validatedData.tripType === 'one-way' && validatedData.distanceReturn && validatedData.distanceReturn > 0) {
  console.warn(`[BOOKING] One-way booking has distanceReturn=${validatedData.distanceReturn}, should be 0`);
  validatedData.distanceReturn = 0;
}
```

### 5. Validation Schema (`lib/validations/booking.ts`)
**Changes:**
- ✅ Updated comment to clarify `distanceReturn` should be 0 for one-way

## Tariff Logic (Confirmed Correct)

### One-Way (Aller Simple) Example
**Route:** Cluses (depot) → Annecy (pickup) → Genève (dropoff)

**Distances:**
- CA_out: 20km (depot → pickup)
- TP: 45km (pickup → dropoff) ← **Main segment WITH client**
- CA_return: 0km ← **FORCED TO ZERO for one-way**

**Price Calculation:**
```
costCA_out = 20km × €1.32 = €26.40
costTP = 45km × €1.32 = €59.40
costCA_return = 0km × €1.32 = €0.00
----------------------------------------
Total = €85.80 TTC
```

### Round-Trip (Aller-Retour) Example
**Same route but A/R:**

**Distances:**
- CA_out: 20km (depot → pickup)
- TP: 45km (pickup → dropoff)
- CA_return: 20km (dropoff → depot) ← **INCLUDED for round-trip**

**Price Calculation:**
```
costCA_out = 20km × €1.32 = €26.40
costTP = 45km × €1.32 = €59.40
costCA_return = 20km × €1.32 = €26.40
----------------------------------------
Total = €112.20 TTC
```

## Testing Checklist

- [ ] Create a one-way booking via frontend
- [ ] Verify displayed price matches stored `totalPrice` in database
- [ ] Verify `distanceReturn` is 0 in database for one-way
- [ ] Generate invoice/BDR/devis and verify:
  - Trip type is shown (A/S or A/R)
  - Only client distance is shown
  - Clarifying note appears for A/S
  - Price matches booking
- [ ] Create a round-trip booking and verify `distanceReturn` is included
- [ ] Test admin manual booking creation with one-way

## Impact

✅ **Transparency:** Clients now clearly see trip type on invoices
✅ **Accuracy:** Multiple safeguards ensure one-way trips don't charge for empty return
✅ **Clarity:** Invoices explain what distance is being charged
✅ **Consistency:** All document types (devis, BDR, facture) show same info

## Files Modified
- `lib/pdf/generator.ts` - Invoice/document generation
- `app/api/pricing/estimate/route.ts` - Price estimation API
- `lib/pricing/tariffs-2026.ts` - Core pricing logic
- `app/api/bookings/route.ts` - Booking creation
- `lib/validations/booking.ts` - Schema validation

## Notes
- The system already had the correct logic in place
- Added defensive programming and logging to catch edge cases
- Improved invoice clarity to prevent client confusion
- All changes are backward compatible with existing bookings
