// GIVEN: errors that mean something. Code below the controllers throws one
// of these; the error handler in app.ts turns each into its status code.
// Each is just a relabelled Error -- the class itself is the signal.

// 400: the request is malformed. Thrown by a SERVICE that rejects a single
// value and stops -- registerUser with a missing password, say. The services
// don't know HTTP exists, so they can't answer 400 themselves.
//
// Request-body validators (validateOrder, validateMenuItem) work differently
// on purpose: they collect EVERY problem and return the list, and the
// controller answers 400 { errors }. One thrown error carries one message,
// and a customer who sent three bad fields should hear about all three.
export class ValidationError extends Error {}

// 401: we don't know who you are -- no credentials, or bad ones.
export class AuthenticationError extends Error {}

// 403: we know who you are, and you're not allowed to do this.
export class AuthorizationError extends Error {}

// 409: the request clashes with something that already exists.
export class ConflictError extends Error {}
