import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../api/common.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  // Avoid logging request bodies or database error details that may contain private data.
  const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number' ? error.status : 0;
  const malformedJson = error instanceof SyntaxError && error && typeof error === 'object' && 'body' in error;
  const validation = error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;
  const duplicate = error && typeof error === 'object' && 'code' in error && error.code === 11000;
  const safeStatus = status === 413 ? 413 : status === 400 || malformedJson || validation ? 400 : status === 403 ? 403 : status === 404 ? 404 : status === 409 || duplicate ? 409 : 500;
  if (safeStatus === 500) console.error('API request failed:', error instanceof Error ? error.name : 'UnknownError');
  const validationFields = error instanceof mongoose.Error.ValidationError
    ? Object.keys(error.errors)
    : error instanceof mongoose.Error.CastError ? [error.path] : [];
  const message = error instanceof ApiError
    ? error.message
    : safeStatus === 413 ? 'Request body is too large'
      : malformedJson ? 'Request body is not valid JSON'
        : validation ? `Request validation failed${validationFields.length ? ` for: ${validationFields.join(', ')}` : ''}`
          : safeStatus === 400 ? 'Invalid request'
            : safeStatus === 403 ? 'Request origin is not allowed'
              : safeStatus === 404 ? 'Record not found'
                : safeStatus === 409 ? duplicate ? 'A record with these details already exists' : 'Record conflicts with existing data'
                  : 'Unexpected server error';
  res.status(safeStatus).json({ error: { message } });
};
