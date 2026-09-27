/**
 * File: tests/domain.test.ts
 * Purpose: Automated unit tests for domain calculation, expiry logic, and WhatsApp alert generation.
 * Author: Hirush Global AMS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateDaysRemaining } from '../components/shared/DomainManager/domainUtils';

const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('Domain Utility Tests', () => {
  test('returns 9999 when expiryDate is undefined or empty', () => {
    assert.strictEqual(calculateDaysRemaining(undefined), 9999);
    assert.strictEqual(calculateDaysRemaining(''), 9999);
  });

  test('calculates correct days remaining for future dates', () => {
    const today = new Date();
    const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
    const dateStr = formatYMD(futureDate);

    assert.strictEqual(calculateDaysRemaining(dateStr), 10);
  });

  test('calculates negative days remaining for past/expired dates', () => {
    const today = new Date();
    const pastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
    const dateStr = formatYMD(pastDate);

    assert.strictEqual(calculateDaysRemaining(dateStr), -5);
  });

  test('calculates 0 days remaining when expiring today', () => {
    const today = new Date();
    const dateStr = formatYMD(today);

    assert.strictEqual(calculateDaysRemaining(dateStr), 0);
  });
});
