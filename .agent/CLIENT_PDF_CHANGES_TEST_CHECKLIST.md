# Client PDF Changes – Test Checklist

Use this checklist to verify each change from the client PDFs (Modif pages WEB, Grille tarifaire 2026). Test one by one and tick when done.

---

## 1. Homepage (p. 1–3)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 1.1 | **Location scope** | Open homepage. Hero tag shows **"Haute-Savoie & environs • France • Europe"** (or similar). | |
| 1.2 | **Values – "vous"** | Section valeurs/engagements: first value contains **"vous"** in "Nous mettons un point d'honneur à **vous** offrir une expérience irréprochable". | |
| 1.3 | **Values – éthique** | Second value mentions **"l'éthique"** du respect et de la confidentialité. | |
| 1.4 | **Values – 15 années** | Third value: "Plus de 15 années … à voyager en toute sérénité". | |
| 1.5 | **PRO badge** | PRO badge under small driver vignette (top-left) is **smaller**; position unchanged. | |
| 1.6 | **Large vignette** | Large driver vignette (right) overlaps both car image and black area (~1/3 on photo, ~2/3 on black). | |
| 1.7 | **Serpent/road** | Between the two photos, **dashed lines** (serpent/road) are clearly visible (e.g. white on black). | |
| 1.8 | **Transfert A/R wording** | Under "Transfert A/S & A/R" card: **"Retour planifié avec trajet identique de 1 à 3 jours après l'aller."** | |
| 1.9 | **Transfert Forfaitaire wording** | Under "Transfert Forfaitaire" card: **"Retour uniquement le même jour."** | |
| 1.10 | **Scope in copy** | Values/engagements mention **Haute-Savoie & environs, France, Europe** where relevant. | |

---

## 2. Reservation – MAD (Mise à disposition) and UI (p. 4–7, 12–18)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 2.1 | **MAD as choice** | On reservation, MAD (Mise à disposition) is an **optional choice**, in steps of **¼ h (15 min)**. | |
| 2.2 | **15 min = 0,00 €** | Label shows "15 min = 0,00 €" and increments every 15 min. | |
| 2.3 | **Premières minutes gratuites** | Text "Premières minutes gratuites" (or equivalent) is present. | |
| 2.4 | **MAD rates (A/S)** | After free minutes: **18 € TTC / 15 min (jour)** and **27 € TTC / 15 min (nuit)**. | |
| 2.5 | **Tranche entamée due** | Text "Toute tranche de 15 minutes entamée est due" (or equivalent). | |
| 2.6 | **A/R immobilisation label** | For A/R return 1–3 days: label **"Temps d'immobilisation"** / **"Durée d'immobilisation (MAD)"** (not just "attente"). | |
| 2.7 | **Immobilisation MAD rate** | A/R 1–3 days: 15 first minutes free, then **27 € TTC / 15 min** (no day/night for immobilisation). | |
| 2.8 | **Passengers – adults** | "Adultes et enfant de + de 10 ans" with control (- 1 +). | |
| 2.9 | **Passengers – children** | "Enfants - de 10 ans" with **dropdown for age (1 to 10)** when at least one child. | |
| 2.10 | **Calendar – month** | Month/year in **French** (e.g. "Janvier 2026", not "January 2026"). | |
| 2.11 | **Calendar – weekdays** | Weekday headers: **"Dim. Lun. Mar. Mer. Jeu. Ven. Sam."** | |

---

## 3. Round-trip (A/R) and return date (p. 12–18, 29–33)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 3.1 | **Transfer A/R = 1–3 days** | Transfer (non-forfait) A/R: return is **1 to 3 days after** outward (same route), not same day. | |
| 3.2 | **Forfaitaire A/R = same day** | Transfert Forfaitaire A/R: **same day only**; return time same day. | |
| 3.3 | **Two blocks Aller / Retour** | For transfer A/R: "Planifiez votre trajet Aller" and "Planifiez votre trajet Retour" (date + time). | |
| 3.4 | **Return date 1–3 days** | Return date picker allows **only 1, 2 or 3 days after** outward date; other days disabled. | |
| 3.5 | **Return time limit** | Return on day 3 limited to **23:59** (e.g. "jusqu'au [date] à 23h59"). | |
| 3.6 | **Immobilisation displayed** | "Minutes d'immobilisation" / "Durée d'immobilisation (MAD)" shown and computed from distance + return day. | |
| 3.7 | **Block A/R if &lt; 25 km** | If total (CA Aller + TP + CA Retour) **&lt; 25 km**, A/R 1–3 days blocked; message "Forfait agglomération?" (or redirect). | |
| 3.8 | **Bon de réservation** | Bon de réservation shows **date/heure Aller** and **date/heure Retour** for A/R. | |

---

## 4. Minimum booking lead time (CA Aller) (p. 4–7, 8–11)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 4.1 | **Lead time exists** | When pickup address (and optionally date) is set, a **minimum pickup time** is enforced. | |
| 4.2 | **0–30 km CA → 1h** | CA Aller 0–30 km: can only select pickup **≥ 1h from now**. | |
| 4.3 | **30–60 km → 1h30** | CA Aller 30–60 km: minimum **1h30** before pickup. | |
| 4.4 | **Same-day example** | Example: today 25/01 11:25, pickup Vougy 12:00, CA ~8–9 km → 1h before → can select from 11:00; 11:40 allows 12:40 or later. | |
| 4.5 | **Time picker min** | If selected date is **today**, time input **min** is set to (now + lead time). | |

---

## 5. Date/day bug (p. 8–11)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 5.1 | **Correct day for pricing** | Select e.g. **Monday 26/01**; pricing/debug shows **Lundi** and correct **jour/nuit** tariff (not Sunday). | |
| 5.2 | **No UTC shift** | Pickup datetime used for pricing is **local** (date sent as YYYY-MM-DD, time as HH:mm; no wrong day from UTC). | |
| 5.3 | **Night rate label** | Where night rate is shown: **"Tarif nuit / Dim & JF 24/24"** (or equivalent). | |

---

## 6. Péage (toll) and TVA (p. 8–11, 12–18)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 6.1 | **Péage** | Client note: 3,68 € TTC may be wrong – **verify** toll source/calculation (toll-calculator, routing). | |
| 6.2 | **TVA prestation 10%** | Prestation: **10%** TVA. | |
| 6.3 | **TVA péage/MAD 20%** | Péage et MAD: **20%** TVA. | |
| 6.4 | **TVA in devis/PDF** | Devis/quote and PDFs show **TVA breakdown** (10% vs 20%) where relevant. | |

---

## 7. Cancellation policy (CGV) (p. 8–11)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 7.1 | **Annulation anticipée** | CGV page: **"Plus de 48 heures (2 jours) avant la prestation : Frais d'annulation de 50 € si le montant TTC est supérieur à 50 €, aucun remboursement de la course si inférieur à 50 €."** | |
| 7.2 | **Annulation tardive** | **"Moins de 48 heures avant la prestation : Remboursement de 50 % du montant TTC si la course est supérieure à 100 €, aucun remboursement de la course si inférieure à 100 €."** | |

---

## 8. Forfaits 1H and 1H30 (p. 29–33, Grille tarifaire 2026)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 8.1 | **Forfait 1H / 90 km** | Forfait **1H** (ou 90 km) exists: Jour 105,45 € HT / 116 € TTC; Nuit 127,27 € HT / 140 € TTC. | |
| 8.2 | **Forfait 1H30 / 135 km** | Forfait **1H30** (ou 135 km): Jour 158,18 € HT / 174 € TTC; Nuit 190,90 € HT / 210 € TTC. | |
| 8.3 | **Copy "1H à 8H"** | Homepage/services: "Forfaits de **1H à 8H** disponibles" (not 2H à 8H). | |
| 8.4 | **Transfert forfaitaire copy** | "Chauffeur à disposition de **1h à 8h (paliers de 30 min)**", "Forfaits de 1H à 8H disponibles." | |
| 8.5 | **Validation 1H allowed** | Reservation: hourly/forfait allows **1** (and 1.5) hour(s), not only 2–8. | |

---

## 9. Tariff grid 2026 – MAD and extra hour (Grille tarifaire 2026)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 9.1 | **15 min offertes** | MAD: **15 minutes offertes**, then by **15 min entamée**. | |
| 9.2 | **MAD rates** | Jour: **15 € / 15 min** (or 18 € per grid); Nuit: **18 € / 15 min** (and 22.50, 27). Align with client grid. | |
| 9.3 | **Extra hour** | Heure supplémentaire forfait: tarifée par tranche de **10 min** entamée (display/calculation). | |
| 9.4 | **Forfait table** | All forfait rows (1H, 1H30, 2H … 8H) and extra hour match PDF (HT/TTC jour/nuit). | |

---

## 10. Forfait agglomération and short forfait block (p. 29–33)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 10.1 | **Transfer ≤ 25 km** | Transfer (A/S or A/R): if (CA Aller + TP + CA Retour) **≤ 25 km**, forfait agglomération behaviour. | |
| 10.2 | **A/R 1–3 days &lt; 25 km** | If total **&lt; 25 km**, A/R 1–3 days **blocked**; suggest "Forfait agglomération?". | |
| 10.3 | **Forfait &lt; 25 km** | Trajet forfaitaire (hourly): if **estimated** total **&lt; 25 km**, forfait not allowed; message + redirect to forfait agglomération. | |

---

## 11. Bon de réservation (p. 29–33)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 11.1 | **A/R – Aller** | Bon de réservation includes **Date et heure du trajet Aller (planifié)**. | |
| 11.2 | **A/R – Retour** | Bon de réservation includes **Date et heure du trajet Retour (planifié)** for A/R. | |
| 11.3 | **PDF generator** | PDF receives and displays return date/time for both transfer A/R 1–3 days and forfaitaire same day. | |

---

## 12. Distance display (p. 12–18, 19–28)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 12.1 | **A/R = 2× TP** | For A/R, total distance = **CA Aller + TP×2 + CA Retour** (e.g. 423,2 km in client example). | |
| 12.2 | **Same total for MAD** | This total is used for immobilisation MAD grid (&gt;250, 200–250, 150–200, &lt;150, &lt;25 km). | |

---

## 13. Geocoding – Haute-Savoie (74)

| # | What to check | How to test | ☐ |
|---|----------------|--------------|---|
| 13.1 | **74 prioritised** | Type "Mairie de Vougy" in **Adresse de départ**: result in **74 (Haute-Savoie)** appears first (not 42). | |
| 13.2 | **Hint on pickup** | Under "Adresse de départ" a hint: "Pour une adresse en Haute-Savoie, précisez « 74 » ou le code postal si le mauvais département s'affiche." | |

---

## Quick test order

1. **Homepage** (Section 1) – visual + copy.  
2. **CGV** (Section 7) – one page, text only.  
3. **Reservation – calendar & passengers** (2.10, 2.11, 2.8, 2.9).  
4. **Reservation – MAD UI** (2.1–2.7).  
5. **Reservation – lead time** (Section 4).  
6. **Pricing – date bug** (Section 5).  
7. **Pricing – forfaits 1H/1H30** (Section 8).  
8. **Pricing – TVA / péage** (Section 6).  
9. **A/R flow and immobilisation** (Sections 3, 12).  
10. **Bon de réservation PDF** (Section 11).  
11. **Forfait agglomération / &lt; 25 km** (Section 10).  
12. **Geocoding** (Section 13).

Print or keep this file open and tick each box as you complete the test.
