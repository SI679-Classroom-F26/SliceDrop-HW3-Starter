// The loyalty SERVICE: how many points an order earns, keeping each
// customer's running total, and who may see it. Business rules only -- the
// repository just stores whatever number this file decides on.
import * as usersRepository from "../db/users-repository";
import { AuthorizationError } from "../errors";
import { Caller } from "../models/user";

// TODO: calculatePoints -- 100 points per WHOLE dollar: drop the cents
// first (round down), then multiply. A $25.47 order earns 2500; a $0.75
// dipping sauce earns nothing.
export function calculatePoints(total: number): number {
  throw new Error("TODO: calculatePoints");
}

// TODO: addPoints -- change a user's running total by `change` points
// (positive to earn, negative to take back). Read the user with
// usersRepository.findUser, work out the new total, and save it with
// usersRepository.setLoyaltyPoints.
//
// If there's no such user, throw a plain Error: every caller passes the id
// of a user who just placed or owns an order, so a missing one is a bug on
// our side (a 500), not a client mistake.
export async function addPoints(userId: string, change: number): Promise<void> {
  throw new Error("TODO: addPoints");
}

// TODO: getPointsFor -- GET /users/:id/points. A customer may see only
// their own points; staff may see anyone's. Anything else throws an
// AuthorizationError (403).
//
// Here the owner IS the id being asked about, so -- like the lecture's
// getUser -- check BEFORE looking anything up. Then return the user's
// loyaltyPoints, or undefined when there's no such user (the controller
// answers 404).
export async function getPointsFor(caller: Caller, userId: string): Promise<number | undefined> {
  throw new Error("TODO: getPointsFor");
}
