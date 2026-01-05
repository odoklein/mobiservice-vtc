# Automatic French Toll Detection Feature

## Overview
The pricing system now **automatically detects and includes French toll (péage) costs** when estimating trip prices. This provides transparent, accurate pricing without manual toll entry.

## ⚠️ RÈGLE IMPORTANTE: Péages Client Uniquement

**Les péages ne sont comptés QUE lorsque le client est dans le véhicule:**

| Segment | Péages facturés ? | Raison |
|---------|-------------------|--------|
| ✅ **Pickup → Dropoff** | OUI | Client dans le véhicule |
| ❌ Dépôt → Pickup | NON | Chauffeur seul |
| ❌ Dropoff → Dépôt | NON | Chauffeur seul (retour à vide) |

## TVA Différenciée

- **Transport (courses):** TVA 10%
- **Péages autoroute:** TVA 20%

## How It Works

### 1. Route Analysis
When a customer requests a price estimate, the system:
1. Analyzes **ONLY the main trip** (Pickup → Dropoff) for toll costs
2. Uses Google Maps Directions API to detect toll roads (autoroutes)
3. Identifies specific autoroute sections (A40, A41, A43, etc.)

### 2. Cost Calculation
Toll costs are estimated based on:
- **Known toll rates** for common Haute-Savoie routes
- **Distance-based calculation** (~0.13€/km) for other autoroutes
- **2026 Class 1 vehicle rates** (lightweight vehicles)

### 3. Common Routes & Costs

#### A40 - Route des Alpes (Haute-Savoie)
- **Cluses → Geneva**: ~68km → 8.90€
- **Annecy → Geneva**: ~45km → 6.20€
- **Annecy → Chamonix**: ~85km → 11.40€

#### A41 - Annecy to Lyon
- **Annecy → Chambéry**: ~45km → 6.20€
- **Annecy → Lyon**: ~135km → 17.80€

#### A43 - Lyon Corridor
- **Lyon → Chambéry**: ~105km → 14.10€

### 4. Trip Type Multiplier
- **Aller Simple (A/S)**: Toll cost × 1
- **Aller-Retour (A/R)**: Toll cost × 2 (customer makes round trip)

## Technical Implementation

### API Endpoint
```typescript
POST /api/pricing/estimate
{
  "pickupLat": 46.0624,
  "pickupLng": 6.5813,
  "dropoffLat": 46.2038,
  "dropoffLng": 6.1435,
  "pickupDate": "2026-01-10",
  "pickupTime": "14:00",
  "tripType": "one-way"
  // No tollCost needed - auto-detected!
}
```

### Response Structure
```json
{
  "success": true,
  "estimation": {
    "pricing": {
      "totalTTC": 156.50,
      "tollInfo": {
        "detected": true,
        "cost": 8.90,
        "details": "Péages: A40 - 8.90€",
        "tripMultiplier": 1,
        "totalIncluded": 8.90
      }
    }
  }
}
```

### Toll Calculator Service
Located at: `lib/services/toll-calculator.ts`

**Main Function:**
```typescript
calculateTollForTrip({
  depot: { lat, lng },
  pickup: { lat, lng },
  dropoff: { lat, lng },
  tripType: 'one-way' | 'round-trip'
})
```

## Configuration

### Required API Access
Enable these Google Cloud APIs:
1. **Directions API** - For route analysis
2. **Places API** - Already used for address autocomplete
3. **Geocoding API** - Already used for coordinates

**Cost:** ~$0.005 per Directions API call (very affordable!)

### Environment Variable
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

The same key powers:
- ✅ Address autocomplete
- ✅ Toll detection
- ✅ Route analysis

## Benefits

### For Customers
- **Transparent pricing** - No surprises about toll costs
- **Accurate estimates** - Reflects real route costs
- **No manual input** - Fully automatic

### For Business
- **Competitive pricing** - Include actual costs in quotes
- **Reduced disputes** - Clear toll inclusion
- **Professional service** - Shows attention to detail

## Fallbacks & Error Handling

### If Toll Detection Fails:
- System continues with pricing estimate
- No toll cost is added (conservative approach)
- Warning logged for monitoring

### Manual Override:
You can still manually specify toll costs via API:
```json
{
  "tollCost": 12.50  // Manual override
}
```

## Monitoring

Check server logs for toll detection activity:
```
[PRICING] Péages détectés automatiquement: { cost: 8.90, details: "Péages: A40 - 8.90€" }
```

## Future Enhancements

Potential improvements:
1. **Real-time toll rates** via TollGuru API
2. **Time-based toll variation** (peak hours)
3. **Multiple route comparison** (fastest vs cheapest)
4. **Toll receipt generation** for expense reports

## Testing

### Test Routes
1. **Cluses → Geneva Airport**: Should detect A40 toll (~8.90€)
2. **Annecy → Lyon**: Should detect A41 toll (~17.80€)
3. **Local Cluses trips**: Should detect no tolls (0€)

### Debug Mode
Enable detailed pricing logs in console to verify toll detection.

---

**Status:** ✅ Active and Operational
**Last Updated:** January 2026
