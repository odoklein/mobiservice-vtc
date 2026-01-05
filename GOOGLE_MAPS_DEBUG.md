# Google Maps Autocomplete Debug Guide

## Current Issue
Loading icon appears forever when typing in address field.

## Step-by-Step Fix

### Step 1: Verify API Key in .env.local
Open `.env.local` and ensure this EXACT line exists:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAGUzTtDdiBPRMgA2SrxuRHere5I-vhdck
```

**Important:** 
- Must start with `NEXT_PUBLIC_` (Next.js requirement for client-side variables)
- No spaces around the `=`
- Must be in `.env.local` NOT `.env.example`

### Step 2: Restart Dev Server
After adding the key:
1. Press `Ctrl+C` in terminal to stop the server
2. Run `npm run dev` again
3. Wait for "Ready" message

### Step 3: Check Browser Console
1. Open http://localhost:3001/reservation
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for errors containing:
   - "Google Maps"
   - "RefererNotAllowedMapError"
   - "ApiNotActivatedMapError"
   - "InvalidKeyMapError"

### Common Error Messages & Fixes

#### Error: "RefererNotAllowedMapError"
**Cause:** API key is restricted to specific domains
**Fix:** Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
1. Click on your API key
2. Under "Application restrictions", select "None" (for testing)
3. OR add `http://localhost:3001/*` to "Website restrictions"

#### Error: "ApiNotActivatedMapError"  
**Cause:** Places API is not enabled
**Fix:** Go to [Google Cloud Console APIs](https://console.cloud.google.com/apis/library)
1. Search for "Places API"
2. Click "Enable"
3. Also enable "Geocoding API"

#### Error: "InvalidKeyMapError"
**Cause:** API key is invalid or expired
**Fix:** Create a new API key at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Step 4: Quick Test Command
Run this in your browser console (F12 → Console tab):
```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
```

**Expected Result:** Should show your API key
**If "undefined":** The key is NOT in .env.local or server wasn't restarted

## Emergency Fallback: Use DistanceMatrix.ai Instead

If Google Maps continues to have issues, I can switch back to DistanceMatrix.ai autocomplete which was working before. Just let me know!
