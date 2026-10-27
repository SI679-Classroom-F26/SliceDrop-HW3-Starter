// The menu data layer. Nothing above this file knows Mongo exists.
//
// Menu ids are readable strings we chose ("hawaiian") stored as an ordinary
// `id` field -- Mongo's own _id also exists on each document but never leaves
// this file. Contrast with orders, where the Mongo _id IS the id.
import type { Filter } from "mongodb";
import { MENU_COLLECTION } from "../constants";
import { getDb } from "./db";
import { Category, MenuItem } from "../models/menu-item";

// The two reads. The projection strips Mongo's _id so a MenuItem comes back
// exactly as a MenuItem -- the shape in models/menu-item.ts, nothing extra.
export async function getAllMenuItems(category?: string): Promise<MenuItem[]> {
  // The query is typed against MenuItem, but a query string from a URL is
  // just a string. The cast says: treat it as a Category and let an
  // impossible one match nothing: an unknown category returns an empty
  // array, not an error.
  const filter: Filter<MenuItem> = category === undefined ? {} : { category: category as Category };
  return getDb()
    .collection<MenuItem>(MENU_COLLECTION)
    .find(filter, { projection: { _id: 0 } })
    .toArray();
}

export async function findMenuItem(id: string): Promise<MenuItem | undefined> {
  const item = await getDb()
    .collection<MenuItem>(MENU_COLLECTION)
    .findOne({ id }, { projection: { _id: 0 } });
  return item ?? undefined;
}

// insertMenuItem -- insertOne. The controller has already checked the id
// isn't taken. insertOne adds an _id to the object it is given, so insert a
// copy: the caller's MenuItem must stay a MenuItem.
export async function insertMenuItem(item: MenuItem): Promise<void> {
  await getDb().collection<MenuItem>(MENU_COLLECTION).insertOne({ ...item });
}

// updateMenuItem -- $set only the provided fields, return the updated item
// (the same shape findMenuItem returns), or undefined when no item has that id.
export async function updateMenuItem(id: string, changes: Partial<MenuItem>): Promise<MenuItem | undefined> {
  const item = await getDb()
    .collection<MenuItem>(MENU_COLLECTION)
    .findOneAndUpdate({ id }, { $set: changes }, { returnDocument: "after", projection: { _id: 0 } });
  return item ?? undefined;
}

// deleteMenuItem -- deleteOne; report whether anything was actually deleted.
export async function deleteMenuItem(id: string): Promise<boolean> {
  const result = await getDb().collection<MenuItem>(MENU_COLLECTION).deleteOne({ id });
  return result.deletedCount === 1;
}

// Test-only. Functions starting with _ exist only for tests and are never
// called by application code.
export async function _clearMenuItems(): Promise<void> {
  await getDb().collection(MENU_COLLECTION).deleteMany({});
}
