// Typed HTTP errors so controllers stay thin and messages stay safe
// (never leak internals or Stripe errors to the browser).

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const badRequest = (code, message) => new HttpError(400, code, message)
export const unauthorized = (message = 'Please log in to continue.') =>
  new HttpError(401, 'UNAUTHENTICATED', message)
export const forbidden = (code, message) => new HttpError(403, code, message)
export const notFound = (code, message) => new HttpError(404, code, message)
export const conflict = (code, message) => new HttpError(409, code, message)
export const serviceUnavailable = (message = 'Payment service is not configured yet.') =>
  new HttpError(503, 'SERVICE_UNAVAILABLE', message)

// Wraps async route handlers so rejections reach the error middleware.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
