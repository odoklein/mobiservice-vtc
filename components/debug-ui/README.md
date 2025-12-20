# Debug UI Components

This folder contains debugging and development UI components that are **NOT included** in the production user interface.

## Components

### PricingDebugPanel

A comprehensive debug panel that displays detailed pricing calculation information.

**Features:**
- Distance segments breakdown (CA aller, TP, CA retour)
- Total distance calculation
- Day/Night rate indicator
- Trip type (A/S or A/R) display
- Tariff grid details (bracket, €/km rates)
- Formula breakdown with step-by-step calculation
- Raw JSON data viewer

### DebugModeToggle

A toggle button component to show/hide the debug panel.

## Usage

To add the debug panel to any page:

```tsx
'use client';

import { useState } from 'react';
import { PricingDebugPanel, DebugModeToggle } from '@/components/debug-ui';

export default function YourPage() {
  const [debugMode, setDebugMode] = useState(false);
  
  // Your booking data object
  const bookingData = {
    distanceCA: 10.5,
    distanceTP: 25.0,
    distanceReturn: 10.5,
    tripType: 'one-way',
    isNightRate: false,
    totalPrice: 45.00,
    totalPriceHT: 40.91,
    tvaAmount: 4.09,
    priceBreakdown: {
      costCA_out: 10.00,
      costTP: 25.00,
      costCA_return: 10.00,
      tollCost: 0,
      isForfaitAgglomeration: false,
      bracket: '25-50',
    },
  };

  return (
    <div>
      {/* Your normal UI */}
      
      {/* Debug Toggle */}
      <DebugModeToggle 
        debugMode={debugMode} 
        onToggle={() => setDebugMode(!debugMode)} 
      />
      
      {/* Debug Panel (only visible when debugMode is true) */}
      {debugMode && <PricingDebugPanel bookingData={bookingData} />}
    </div>
  );
}
```

## When to Use

- During development to verify pricing calculations
- When debugging pricing issues reported by users
- For admin users who need to see calculation details

## Note

These components are kept separate from the production UI to:
1. Keep the user-facing interface clean
2. Reduce bundle size for end users
3. Provide a quick way to add/remove debugging capabilities


