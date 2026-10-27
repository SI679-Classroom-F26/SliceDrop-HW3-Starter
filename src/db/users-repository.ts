// GIVEN: the users data layer. Same shape as the orders repository: the
// stored document has Mongo's _id, and toUser turns it into the string id
// the rest of the app uses -- here and nowhere else.
import { ObjectId } from "mongodb";
import type { WithId } from "mongodb";
import { USERS_COLLECTION } from "../constants";
import { getDb } from "./db";
import { NewUser, User } from "../models/user";

type UserDocument = Omit<User, "id">;

function toUser(doc: WithId<UserDocument>): User {
  return {
    id: doc._id.toHexString(),
    username: doc.username,
    hashedPassword: doc.hashedPassword,
    role: doc.role,
    // Users stored before the loyalty program have no field yet: that's 0.
    loyaltyPoints: doc.loyaltyPoints ?? 0,
  };
}

function users() {
  return getDb().collection<UserDocument>(USERS_COLLECTION);
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const doc = await users().findOne({ username });
  return doc === null ? undefined : toUser(doc);
}

export async function findUser(id: string): Promise<User | undefined> {
  const doc = await users().findOne({ _id: new ObjectId(id) });
  return doc === null ? undefined : toUser(doc);
}

export async function insertUser(user: NewUser): Promise<User> {
  const doc: UserDocument = {
    username: user.username,
    hashedPassword: user.hashedPassword,
    role: user.role,
    loyaltyPoints: 0,
  };
  const result = await users().insertOne(doc);
  return toUser({ ...doc, _id: result.insertedId });
}

// GIVEN (loyalty): overwrite a user's points total with a new number. The
// math -- what the new number should be -- belongs to the loyalty service.
export async function setLoyaltyPoints(id: string, loyaltyPoints: number): Promise<void> {
  await users().updateOne({ _id: new ObjectId(id) }, { $set: { loyaltyPoints } });
}

// GIVEN: test-only.
export async function _clearUsers(): Promise<void> {
  await users().deleteMany({});
}
