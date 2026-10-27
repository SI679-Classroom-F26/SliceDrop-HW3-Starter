// The orders data layer. Nothing above this file knows Mongo exists.
//
// Order ids are Mongo ObjectIds. In responses they travel as 24-hex-character
// strings: _id.toHexString() on the way out, new ObjectId(id) on the way in.
// The validateId middleware guarantees any id reaching this file is at least
// the right shape.
//
// The mapping between "stored document" (has _id) and "API Order" (has
// string id) happens HERE and nowhere else.
import { ObjectId } from "mongodb";
import type { Filter, WithId } from "mongodb";
import { ORDERS_COLLECTION } from "../constants";
import { getDb } from "./db";
import { NewOrder, Order, OrderStatus } from "../models/order";

// The stored document: an Order minus its string id (Mongo supplies _id).
type OrderDocument = Omit<Order, "id">;

function toOrder(doc: WithId<OrderDocument>): Order {
  return {
    id: doc._id.toHexString(),
    customerName: doc.customerName,
    items: doc.items,
    status: doc.status,
    createdAt: doc.createdAt,
    total: doc.total,
    customerId: doc.customerId,
    pointsEarned: doc.pointsEarned ?? 0,
  };
}

function orders() {
  return getDb().collection<OrderDocument>(ORDERS_COLLECTION);
}

// addOrder -- status "pending", createdAt now, the total the service
// computed, and (GIVEN, new in HW3) the customerId of whoever placed it and
// the points it earned. insertedId becomes the string id.
export async function addOrder(
  newOrder: NewOrder,
  total: number,
  customerId: string,
  pointsEarned: number,
): Promise<Order> {
  const doc: OrderDocument = {
    customerName: newOrder.customerName,
    items: newOrder.items,
    status: "pending",
    createdAt: new Date().toISOString(),
    total,
    customerId,
    pointsEarned,
  };

  const result = await orders().insertOne(doc);
  return toOrder({ ...doc, _id: result.insertedId });
}

// listOrders -- GIVEN (changed in HW3): everything, or narrowed by status
// and/or by the customer who placed it. Leave a field out to not filter on it.
export async function listOrders(filter: { status?: string; customerId?: string } = {}): Promise<Order[]> {
  const query: Filter<OrderDocument> = {};
  if (filter.status !== undefined) {
    query.status = filter.status as OrderStatus;
  }
  if (filter.customerId !== undefined) {
    query.customerId = filter.customerId;
  }
  const docs = await orders().find(query).toArray();
  return docs.map(toOrder);
}

// getOrder -- findOne by ObjectId; undefined when nothing matches.
export async function getOrder(id: string): Promise<Order | undefined> {
  const doc = await orders().findOne({ _id: new ObjectId(id) });
  return doc === null ? undefined : toOrder(doc);
}

// updateOrderStatus -- the updated Order, or undefined when no order has
// that id. The controller has already checked the status is a real one.
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  const doc = await orders().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status } },
    { returnDocument: "after" },
  );
  return doc === null ? undefined : toOrder(doc);
}

// Test-only.
export async function _clearOrders(): Promise<void> {
  await getDb().collection(ORDERS_COLLECTION).deleteMany({});
}
