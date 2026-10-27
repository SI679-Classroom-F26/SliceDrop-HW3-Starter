// The database connection, owned by this module and nobody else:
//
//   - index.ts calls connect() BEFORE the server starts listening.
//   - app.ts never connects. Tests connect to a throwaway in-memory Mongo
//     instead, and everything else works identically.
//
import { MongoClient } from "mongodb";
import type { Db } from "mongodb";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connect(uri: string, dbName: string): Promise<void> {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
}

export async function disconnect(): Promise<void> {
  if (client !== undefined) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

export function getDb(): Db {
  if (db === undefined) {
    throw new Error("getDb() called before connect() -- see src/index.ts for the startup order.");
  }
  return db;
}
