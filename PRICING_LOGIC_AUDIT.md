# Pricing Engine vs. Frontend Audit

This document compares the published rates on the website (`/tarifs`) with the actual calculation engine (`/api/pricing/estimate`).

## 🟢 Verified Matches (Sync confirmed)

The following logic is consistent between the frontend display and the backend engine:

### 1. Forfaits Agglomération (< 25km)
*   **Website**: 33.00€ TTC (Jour) / 47.50€ TTC (Nuit)
*   **Engine**: Exact match (`FORFAIT_AGGLOMERATION` constant)
*   **Condition**: Applied when total distance (A/R) ≤ 25km.

### 2. Night Rate Definition
*   **Website**: 20h00 - 7h00, Sundays, and Public Holidays.
*   **Engine**: Matches perfectly (`isNightRate` function checks 20-7, `day===0`, `isFrenchHoliday`).

### 3. Mise à Disposition (MAD)
*   **Website**: 2H Forfait = 232€ (Day) / 280€ (Night)
*   **Engine**: Constants match the frontend table exactly.

---

## 🟡 Divergences / Simplifications

These are not necessarily "errors" but simplifications on the frontend that differ from the engine's more complex logic.

### 1. The "Hidden" Discount (CA Rates)
*   **Website Display**: Shows a flat rate of **1.32€/km** (Day) and **1.90€/km** (Night).
*   **Actual Engine**:
    *   **Tramet Principal (TP)**: Always uses 1.32€/1.90€ per km. ✅ match.
    *   **Coût d'Approche (CA)**: The engine applies **decreasing rates** for long distances to stay competitive.
        *   0-50km: 1.32€/km
        *   50-75km: 1.10€/km
        *   75-100km: 0.90€/km
        *   100km+: 0.70€/km
*   **Impact**: For long trips (>50km total), the **actual price will be CHEAPER** than what a customer might manually calculate using the website rates.
*   **Action**: Nothing required if you want to keep the marketing simple ("prices starting at...").

---

## 🔴 Critical Issues Needs Confirmation

### 1. VAT (TVA) Handling on Tolls
*   **Website Claim**:
    *   "Tous les prix sont TTC (TVA 10% sur le trajet)"
    *   "Péages inclus sur les prix estimés (**TVA 20%**)"
*   **Current Engine Logic**:
    *   The engine adds the toll cost to the total price, then calculates VAT at **10% on the entire amount**.
    *   `Total TTC = Trajet + Péage`
    *   `Total HT = Total TTC / 1.10`
*   **Problem**: If you paid 20% VAT on the toll and invoice it inside a 10% VAT service, the accounting might be incorrect.
*   **Recommendation**:
    1.  **Option A (Simpler)**: Treat toll as a business expense included in the fare (subject to 10% VAT).
    2.  **Option B (Strict)**: Separate the toll line item in the invoice as a "débours" (disbursement) or split VAT rates.
    *   *Current implementation follows Option A for the estimate.*

### 2. Round Trip Tolls
*   **Website**: "Péages inclus".
*   **Engine**:
    *   **Aller Simple (One-Way)**: Adds toll cost x 1.
    *   **Aller-Retour (Round-Trip)**: Adds toll cost x 2.
*   **Verification**: Please confirm if you charge the return toll to the customer even on a "One-Way" trip (since the car has to come back).
    *   *Current Logic*: Only charges 1-way toll for 1-way booking. (Customer pays for their specific ride on the highway). The return "CA" assumes standard km rate, not specific toll reimbursement.

---

## Summary of Actions Taken
1.  **Tolls**: Automatic detection is now ACTIVE.
2.  **Prices**: The engine ensures the *minimum* price is the Agglomeration Forfait.

## Next Steps
*   [ ] Confirm if VAT logic needs changing (Split 10%/20% or keep simple 10%).
*   [ ] Confirm if One-Way trips should charge toll x 2 (for driver return) or x 1 (current).
