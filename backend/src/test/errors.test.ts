import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../api/common.js';
import { errorHandler } from '../middleware/errors.js';

test('API errors retain safe actionable client messages', () => {
  let status = 0;
  let payload: unknown;
  const response = {
    status(value: number) { status = value; return this; },
    json(value: unknown) { payload = value; return this; },
  };
  errorHandler(new ApiError(400, 'category is required'), {} as never, response as never, (() => undefined) as never);
  assert.equal(status, 400);
  assert.deepEqual(payload, { error: { message: 'category is required' } });
});
