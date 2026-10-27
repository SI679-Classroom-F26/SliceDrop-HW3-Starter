// Unit tests for cancelOrder: one function, its repository and the loyalty
// service faked. The e2e suite proves the HTTP answers are right; these
// prove HOW -- that nothing is written, and no points move, unless every
// check has passed first.
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as ordersRepository from "../db/orders-repository";
import { AuthorizationError, ConflictError } from "../errors";
import type { Order } from "../models/order";
import type { Caller } from "../models/user";
import * as loyaltyService from "../services/loyalty-service";
import * as ordersService from "../services/orders-service";

beforeEach(() => {
  vi.restoreAllMocks();
});

// No database here, so ids only need to be distinct, not real ObjectIds.
const ORDER_ID = "order-id";
const OWNER_ID = "owner-id";
const OTHER_CUSTOMER_ID = "other-customer-id";

const owner: Caller = { id: OWNER_ID, role: "customer" };
const otherCustomer: Caller = { id: OTHER_CUSTOMER_ID, role: "customer" };

// A pending order placed by `owner`, as the repository hands it back.
const makeOrder = (fields: Partial<Order>): Order => ({
  id: ORDER_ID,
  customerId: OWNER_ID,
  customerName: "Ada",
  items: [{ menuItemId: "soda", quantity: 1, size: "20 oz" }],
  status: "pending",
  createdAt: "2026-10-20T12:00:00.000Z",
  total: 1.99,
  pointsEarned: 100,
  ...fields,
});

describe("cancelOrder", () => {
  it("writes nothing when the caller does not own the order", async () => {
    vi.spyOn(ordersRepository, "getOrder").mockResolvedValue(makeOrder({}));
    const update = vi.spyOn(ordersRepository, "updateOrderStatus");
    const addPoints = vi.spyOn(loyaltyService, "addPoints");

    await expect(ordersService.cancelOrder(otherCustomer, ORDER_ID)).rejects.toThrow(AuthorizationError);
    expect(update).not.toHaveBeenCalled();
    expect(addPoints).not.toHaveBeenCalled();
  });

  it("writes nothing when the order is no longer pending", async () => {
    vi.spyOn(ordersRepository, "getOrder").mockResolvedValue(makeOrder({ status: "in-progress" }));
    const update = vi.spyOn(ordersRepository, "updateOrderStatus");
    const addPoints = vi.spyOn(loyaltyService, "addPoints");

    await expect(ordersService.cancelOrder(owner, ORDER_ID)).rejects.toThrow(ConflictError);
    expect(update).not.toHaveBeenCalled();
    expect(addPoints).not.toHaveBeenCalled();
  });

  it("writes nothing, and returns undefined, when no order has that id", async () => {
    vi.spyOn(ordersRepository, "getOrder").mockResolvedValue(undefined);
    const update = vi.spyOn(ordersRepository, "updateOrderStatus");
    const addPoints = vi.spyOn(loyaltyService, "addPoints");

    expect(await ordersService.cancelOrder(owner, ORDER_ID)).toBeUndefined();
    expect(update).not.toHaveBeenCalled();
    expect(addPoints).not.toHaveBeenCalled();
  });

  it("asks the repository to cancel exactly that order for its owner", async () => {
    vi.spyOn(ordersRepository, "getOrder").mockResolvedValue(makeOrder({}));
    const update = vi
      .spyOn(ordersRepository, "updateOrderStatus")
      .mockResolvedValue(makeOrder({ status: "cancelled" }));
    vi.spyOn(loyaltyService, "addPoints").mockResolvedValue();

    const result = await ordersService.cancelOrder(owner, ORDER_ID);

    expect(update).toHaveBeenCalledWith(ORDER_ID, "cancelled");
    expect(result?.status).toBe("cancelled");
  });

  it("takes back exactly the points the order earned, from its owner", async () => {
    const POINTS_THE_ORDER_EARNED = 2500;
    vi.spyOn(ordersRepository, "getOrder").mockResolvedValue(makeOrder({ pointsEarned: POINTS_THE_ORDER_EARNED }));
    vi.spyOn(ordersRepository, "updateOrderStatus").mockResolvedValue(makeOrder({ status: "cancelled" }));
    const addPoints = vi.spyOn(loyaltyService, "addPoints").mockResolvedValue();

    await ordersService.cancelOrder(owner, ORDER_ID);

    expect(addPoints).toHaveBeenCalledWith(OWNER_ID, -POINTS_THE_ORDER_EARNED);
  });
});
