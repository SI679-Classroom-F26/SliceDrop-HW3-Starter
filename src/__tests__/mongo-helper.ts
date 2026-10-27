// Shared test plumbing. Each suite runs against its own throwaway in-memory
// Mongo: started in beforeAll, stopped in afterAll, and between tests orders
// and users are wiped and the menu is re-seeded, so no test can lean on
// another's leftovers.
// This file is not a test -- vitest only picks up *.test.ts.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getJwtSecret } from "../config";
import { connect, disconnect } from "../db/db";
import { _clearMenuItems } from "../db/menu-repository";
import { _clearOrders } from "../db/orders-repository";
import { _clearUsers, insertUser } from "../db/users-repository";
import type { Role, User } from "../models/user";
import { seedMenuIfEmpty } from "../seed/seed";

let mongo: MongoMemoryServer | undefined;

// Order ids for the two kinds of "bad id". One is shaped like a real
// ObjectId but was never stored (404); the other isn't an ObjectId at all,
// so validateId turns it away before the database sees it (400).
export const UNKNOWN_ORDER_ID = new ObjectId().toHexString();
export const MALFORMED_ORDER_ID = "not-an-object-id";

// The same two for users.
export const UNKNOWN_USER_ID = new ObjectId().toHexString();
export const MALFORMED_USER_ID = "not-an-object-id";

export async function startTestDb(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  await connect(mongo.getUri(), "test");
}

export async function stopTestDb(): Promise<void> {
  await disconnect();
  if (mongo !== undefined) {
    await mongo.stop();
  }
}

// Orders and users start empty; the menu starts seeded. Exactly what a
// fresh restaurant looks like.
export async function resetData(): Promise<void> {
  await _clearOrders();
  await _clearUsers();
  await _clearMenuItems();
  await seedMenuIfEmpty();
}

// Puts a user straight into the database -- the only way a test gets a
// staff account, since registration only makes customers. Cost 4 instead of
// 11: these hashes protect nothing, and a slow hash per test adds up.
export async function createUser(username: string, password: string, role: Role): Promise<User> {
  return insertUser({ username, hashedPassword: await bcrypt.hash(password, 4), role });
}

// A token for a made-up user, signed with the test secret -- what login
// would hand out, without the round trip. Each call is a different person:
// `id` is the token's sub, which is what ownership checks compare against.
export function signToken(role: Role, username: string = role): { id: string; token: string } {
  const id = new ObjectId().toHexString();
  return { id, token: jwt.sign({ sub: id, username, role }, getJwtSecret(), { expiresIn: "1h" }) };
}

// A REAL user in the database, plus a token for them -- for any test where
// the app looks the user up (placing an order credits their points). Users
// are wiped before every test, so call this in a beforeEach, not at the top
// of the file.
export async function createSignedInUser(role: Role, username: string): Promise<{ id: string; token: string }> {
  const user = await createUser(username, `${username}-password`, role);
  const token = jwt.sign({ sub: user.id, username, role }, getJwtSecret(), { expiresIn: "1h" });
  return { id: user.id, token };
}
