/**
 * Test estimation API for each scenario (Transfer A/S, Transfer A/R, Routing distances).
 * Run: npm run dev (in another terminal), then node scripts/test-estimate-scenarios.mjs
 * Requires: .env with DISTANCEMATRIX_API_KEY for real distance/routing (otherwise tests fail with REQUEST_DENIED).
 */

const BASE = 'http://localhost:3000';

// Cluses depot and two points in Haute-Savoie (real coords for DistanceMatrix)
const COORDS = {
  depot: { lat: 46.0624, lng: 6.5813 },
  pickup: { lat: 46.0624, lng: 6.5813 },   // same as depot for short test
  dropoff: { lat: 45.8992, lng: 6.1294 },  // Annecy
};

async function testTransferOneWay() {
  console.log('\n--- Scenario 1: Transfer Aller Simple (A/S) ---');
  const body = {
    pickupAddress: '4 rue des artisans, Cluses',
    pickupLat: COORDS.pickup.lat,
    pickupLng: COORDS.pickup.lng,
    dropoffAddress: 'Annecy',
    dropoffLat: COORDS.dropoff.lat,
    dropoffLng: COORDS.dropoff.lng,
    pickupDate: '2026-02-10',
    pickupTime: '14:00',
    tripType: 'one-way',
    tollCost: 0,
    waitingMinutes: 0,
  };
  const res = await fetch(`${BASE}/api/pricing/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.log('FAIL:', res.status, data.error || data.message || data);
    return false;
  }
  if (!data.success || !data.estimation) {
    console.log('FAIL: no estimation', data);
    return false;
  }
  const est = data.estimation;
  console.log('OK - totalTTC:', est.pricing?.totalTTC, 'distances:', est.distances?.total, 'duration:', est.duration);
  if (typeof est.distances?.ca_out !== 'number' || typeof est.distances?.tp !== 'number') {
    console.log('FAIL: missing distance fields');
    return false;
  }
  return true;
}

async function testTransferRoundTrip() {
  console.log('\n--- Scenario 2: Transfer Aller-Retour (A/R) ---');
  const body = {
    pickupAddress: '4 rue des artisans, Cluses',
    pickupLat: COORDS.pickup.lat,
    pickupLng: COORDS.pickup.lng,
    dropoffAddress: 'Annecy',
    dropoffLat: COORDS.dropoff.lat,
    dropoffLng: COORDS.dropoff.lng,
    pickupDate: '2026-02-10',
    pickupTime: '14:00',
    tripType: 'round-trip',
    tollCost: 0,
    waitingMinutes: 30,
  };
  const res = await fetch(`${BASE}/api/pricing/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.log('FAIL:', res.status, data.error || data.message || data);
    return false;
  }
  if (!data.success || !data.estimation) {
    console.log('FAIL: no estimation', data);
    return false;
  }
  const est = data.estimation;
  const totalAR = est.distances?.totalAR;
  console.log('OK - totalTTC:', est.pricing?.totalTTC, 'totalAR:', totalAR, 'rateType:', est.pricing?.rateType);
  if (typeof totalAR !== 'number') {
    console.log('FAIL: totalAR missing for A/R');
    return false;
  }
  return true;
}

async function testRoutingDistances() {
  console.log('\n--- Scenario 3: Routing distances (for hourly) ---');
  const body = {
    depot: COORDS.depot,
    pickup: COORDS.pickup,
    dropoff: COORDS.dropoff,
  };
  const res = await fetch(`${BASE}/api/routing/distances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const segments = await res.json();
  if (!res.ok) {
    console.log('FAIL:', res.status, segments?.error || segments?.message || segments);
    return false;
  }
  if (typeof segments.distanceCA !== 'number' || typeof segments.distanceTP !== 'number' || typeof segments.totalDuration !== 'number') {
    console.log('FAIL: missing segment fields', segments);
    return false;
  }
  console.log('OK - distanceCA:', segments.distanceCA, 'distanceTP:', segments.distanceTP, 'totalDuration:', segments.totalDuration);
  return true;
}

async function main() {
  console.log('Estimation scenarios test (ensure dev server is running on', BASE + ')');
  let ok = 0;
  let fail = 0;
  try {
    if (await testTransferOneWay()) ok++; else fail++;
  } catch (e) {
    console.log('Error:', e.message);
    fail++;
  }
  try {
    if (await testTransferRoundTrip()) ok++; else fail++;
  } catch (e) {
    console.log('Error:', e.message);
    fail++;
  }
  try {
    if (await testRoutingDistances()) ok++; else fail++;
  } catch (e) {
    console.log('Error:', e.message);
    fail++;
  }
  console.log('\n--- Result:', ok, 'passed,', fail, 'failed ---');
  process.exit(fail > 0 ? 1 : 0);
}

main();
