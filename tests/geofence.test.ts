/**
 * File: tests/geofence.test.ts
 * Purpose: Automated unit tests for Geofencing and Haversine distance calculations.
 * Author: Hirush Global AMS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateDistance } from '../components/user/attendance/utils';

describe('Geofence & Haversine Distance Calculations', () => {
  // Office location coordinates (Colombo, Sri Lanka)
  const OFFICE_LAT = 6.9271;
  const OFFICE_LON = 79.8612;

  test('returns 0 meters for identical coordinates', () => {
    const dist = calculateDistance(OFFICE_LAT, OFFICE_LON, OFFICE_LAT, OFFICE_LON);
    assert.strictEqual(Math.round(dist), 0);
  });

  test('correctly identifies when user is inside geofence radius (within 100m)', () => {
    // A point roughly 30-40 meters away (approx 0.0003 deg latitude difference)
    const userLat = OFFICE_LAT + 0.0003;
    const userLon = OFFICE_LON;
    const GEOFENCE_RADIUS = 100; // meters

    const dist = calculateDistance(OFFICE_LAT, OFFICE_LON, userLat, userLon);
    assert.ok(dist < GEOFENCE_RADIUS, `Expected ${dist}m to be within ${GEOFENCE_RADIUS}m`);
    assert.ok(dist > 20, `Expected distance to be non-zero (approx 33m), got ${dist}m`);
  });

  test('correctly identifies when user is outside geofence radius', () => {
    // A point roughly 1-2 km away (approx 0.01 deg latitude difference ~ 1.11 km)
    const remoteLat = OFFICE_LAT + 0.015;
    const remoteLon = OFFICE_LON;
    const GEOFENCE_RADIUS = 100;

    const dist = calculateDistance(OFFICE_LAT, OFFICE_LON, remoteLat, remoteLon);
    assert.ok(dist > GEOFENCE_RADIUS, `Expected ${dist}m to be outside ${GEOFENCE_RADIUS}m`);
    assert.ok(dist > 1000, `Expected distance to be > 1km, got ${dist}m`);
  });

  test('computes known geographical distances accurately (Colombo to Kandy ~95-100km)', () => {
    const KANDY_LAT = 7.2906;
    const KANDY_LON = 80.6337;

    const distMeters = calculateDistance(OFFICE_LAT, OFFICE_LON, KANDY_LAT, KANDY_LON);
    const distKm = distMeters / 1000;

    // Haversine distance between Colombo and Kandy center is approx 94 - 98 km
    assert.ok(distKm >= 90 && distKm <= 105, `Distance in km should be between 90 and 105, got ${distKm}`);
  });
});
