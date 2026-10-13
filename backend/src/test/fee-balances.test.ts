import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveFeeStatus } from '../services/fee-balances.js';

test('fee status uses payments and UTC due date to distinguish paid, pending, and overdue', () => {
  const now = new Date('2026-10-13T12:00:00.000Z');
  assert.equal(deriveFeeStatus(100, 100, '2026-10-01T00:00:00.000Z', now), 'Paid');
  assert.equal(deriveFeeStatus(100, 40, '2026-10-13T00:00:00.000Z', now), 'Pending');
  assert.equal(deriveFeeStatus(100, 40, '2026-10-12T00:00:00.000Z', now), 'Overdue');
  assert.equal(deriveFeeStatus(100, 0, '2026-10-14T00:00:00.000Z', now), 'Pending');
});
