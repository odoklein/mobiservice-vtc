# Mapbox Address Autocomplete — Debug Guide

## Symptom: input stays disabled / no suggestions appear

### Step 1: Verify the access token in `.env.local`
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...
```
- Must start with `NEXT_PUBLIC_` (Next.js requirement for client-side variables)
- No spaces around the `=`
- Must be in `.env.local`, not `.env.example`

Optional, server-side only (used by routing/toll-detection/geocoding-search
API routes; falls back to the public token if unset):
```env
MAPBOX_ACCESS_TOKEN=sk.ey...
```

### Step 2: Restart the dev server
1. `Ctrl+C` to stop the server
2. `npm run dev`
3. Wait for "Ready"

### Step 3: Check the browser console
1. Open `/reservation`, press `F12` → Console
2. Look for `Mapbox geocoding error: 401/403` (bad/restricted token) or network failures

### Common errors & fixes

#### 401 Unauthorized / 403 Forbidden
**Cause:** Token is invalid, or URL-restricted to a different domain.
**Fix:** In the [Mapbox account tokens page](https://account.mapbox.com/access-tokens/), check the token's URL restrictions include your dev/prod domain (or has none for local testing).

#### Suggestions never appear, no console error
**Cause:** Query is under 3 characters (the app requires ≥3 chars before searching), or the request is being aborted by rapid typing (expected — only the latest debounced request resolves).

#### Wrong country / results outside Haute-Savoie
The component restricts results to `country=fr,ch` and biases results toward Annecy (`proximity`). Edit `HAUTE_SAVOIE_AUTOCOMPLETE_BIAS` in [lib/constants.ts](lib/constants.ts) to adjust.

### Step 4: Quick test command
In the browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)
```
**Expected:** shows the `pk.…` token. **If `undefined`:** the var isn't in `.env.local`, or the server wasn't restarted after adding it.

### Step 5: Test the endpoint directly
```bash
curl "https://api.mapbox.com/search/geocode/v6/forward?q=Cluses&access_token=YOUR_TOKEN&country=fr&language=fr"
```
A working token returns a `FeatureCollection` with `features[]`; an invalid one returns `{"message":"Not Authorized - Invalid Token"}`.
