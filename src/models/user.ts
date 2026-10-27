// GIVEN: the user model -- the same two-shapes pattern as orders, plus a
// third shape for what leaves the server.

export type Role = "customer" | "staff";

/** A user as the app stores it. hashedPassword never leaves the server. */
export interface User {
  id: string;
  username: string;
  hashedPassword: string;
  role: Role;
  // GIVEN (new in HW3, loyalty): the customer's running points total.
  // Every new user starts at 0.
  loyaltyPoints: number;
}

/** What the repository needs to create one: everything but the id. */
export interface NewUser {
  username: string;
  hashedPassword: string;
  role: Role;
}

/** A user as the outside world sees it -- no hashedPassword, ever. */
export interface PublicUser {
  id: string;
  username: string;
  role: Role;
}

/** GIVEN: who is asking, as far as their token says. Controllers build it
 * from res.locals.user; services decide what that caller may do. */
export interface Caller {
  id: string;
  role: Role;
}
