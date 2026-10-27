// The orders SERVICE layer: business logic that is not HTTP (that's the
// controllers) and not database access (that's db/). Pricing is a business
// rule -- it belongs to the restaurant, not to Express and not to Mongo.
//
// You may notice the menu has no service layer at all: its controllers call
// the menu repository directly, because the menu HAS no business logic, and a
// layer that only forwards calls is ceremony, not architecture. Not every
// resource needs every layer.
import { findMenuItem } from "../db/menu-repository";
import * as ordersRepository from "../db/orders-repository";
import * as loyaltyService from "./loyalty-service";
import { AuthorizationError, ConflictError } from "../errors";
import { NewOrder, Order, OrderItem } from "../models/order";
import { Caller } from "../models/user";

// An order is placed all at once: there is no saved cart. The cart lives in
// the client until the customer is ready, and the order arrives complete.
// Every new order starts "pending" (addOrder sets that); the customer can
// cancel it only while it is still pending -- once staff move it to
// "in-progress", the kitchen has started (see cancelOrder).
//
// TODO: placeOrder -- placing an order = pricing it + storing it, and now
// we know WHO is ordering, and they earn points for it:
//   1. price it with calculateOrderTotal
//   2. work out its points with loyaltyService.calculatePoints(total)
//   3. store it: ordersRepository.addOrder(newOrder, total, caller.id, points)
//   4. credit the customer: loyaltyService.addPoints(caller.id, points)
//   5. return the stored order
//
// The caller is built exactly as in the lecture's users controller
// (res.locals.user.sub is the id). There the id was COMPARED against the
// requested one; here you STORE it as the order's customerId. Never take
// the owner from the request body -- anyone can type any id there.
export async function placeOrder(caller: Caller, newOrder: NewOrder): Promise<Order> {
  throw new Error("TODO: placeOrder");
}

// TODO: listOrdersFor -- GET /orders. Staff see every order; a customer sees
// only their own. ordersRepository.listOrders takes { status, customerId }:
// pass status through either way, and add customerId for a customer.
export async function listOrdersFor(caller: Caller, status?: string): Promise<Order[]> {
  throw new Error("TODO: listOrdersFor");
}

// TODO: getOrderFor -- GET /orders/:id. undefined when no order has that id
// (the controller answers 404). Staff may read any order; a customer only
// their own -- anything else throws an AuthorizationError (403).
//
// Unlike the lecture's getUser, you can't check before the lookup: who owns
// an order is written ON the order. See cancelOrder below for the shape.
export async function getOrderFor(caller: Caller, id: string): Promise<Order | undefined> {
  throw new Error("TODO: getOrderFor");
}

/**
 * GIVEN: a customer cancels their own order, while it is still pending.
 * Fetch, then check ownership, then check the business rule, and only then
 * write. Nothing is written unless every check passes -- the unit tests in
 * orders-service.unit.test.ts hold this function to that. One TODO inside.
 */
export async function cancelOrder(caller: Caller, id: string): Promise<Order | undefined> {
  const order = await ordersRepository.getOrder(id);
  if (order === undefined) {
    return undefined;
  }

  if (order.customerId !== caller.id) {
    throw new AuthorizationError("You can only cancel your own orders.");
  }

  // 409: the request clashes with the order's current state.
  if (order.status !== "pending") {
    throw new ConflictError(`Only a pending order can be cancelled; this one is ${order.status}.`);
  }

  const cancelled = await ordersRepository.updateOrderStatus(id, "cancelled");

  // TODO (loyalty): a cancelled order doesn't keep its points. Take back
  // exactly what it earned -- order.pointsEarned -- from order.customerId,
  // using loyaltyService.addPoints with a negative change. Do it here, after
  // every check has passed: a rejected cancel must not touch anyone's points.

  return cancelled;
}

// calculateOrderTotal -- for each item:
//   base price (matching size's price, or the flat price)
//   + crust price + each topping's price   (a sauce choice is free)
//   x quantity
// summed, then rounded to cents at the end (floating point).
//
// Validation has already run, so every id and option is known to exist.
export async function calculateOrderTotal(items: OrderItem[]): Promise<number> {
  let sum = 0;

  for (const item of items) {
    const menuItem = await findMenuItem(item.menuItemId);
    if (menuItem === undefined) {
      throw new Error(`calculateOrderTotal: unknown menu item "${item.menuItemId}" -- validation should have caught this.`);
    }

    const size = menuItem.sizes?.find((option) => option.name === item.size);
    let unitPrice = size?.price ?? menuItem.price ?? 0;

    const crust = menuItem.crusts?.find((option) => option.name === item.crust);
    unitPrice += crust?.price ?? 0;

    for (const toppingName of item.toppings ?? []) {
      const topping = menuItem.toppings?.find((option) => option.name === toppingName);
      unitPrice += topping?.price ?? 0;
    }

    sum += unitPrice * item.quantity;
  }

  return Math.round(sum * 100) / 100;
}
