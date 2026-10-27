import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import {
  MALFORMED_ORDER_ID,
  UNKNOWN_ORDER_ID,
  createSignedInUser,
  resetData,
  startTestDb,
  stopTestDb,
} from "./mongo-helper";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

// Named for their part in each test: the customer who places the order,
// a different customer who must not see it, and a staff member who may.
// Real users, made fresh for every test: placing an order credits points.
type Who = { id: string; token: string };
let owner: Who;
let otherCustomer: Who;
let staffMember: Who;

beforeEach(async () => {
  owner = await createSignedInUser("customer", "owner");
  otherCustomer = await createSignedInUser("customer", "other-customer");
  staffMember = await createSignedInUser("staff", "staff-member");
});

const placeOrder = (who: Who, body: object) =>
  request(app).post("/orders").set("Authorization", `Bearer ${who.token}`).send(body);
const get = (who: Who, path: string) => request(app).get(path).set("Authorization", `Bearer ${who.token}`);
const cancel = (who: Who, id: string) =>
  request(app).patch(`/orders/${id}/cancel`).set("Authorization", `Bearer ${who.token}`);
const setStatus = (id: string, status: string) =>
  request(app).patch(`/orders/${id}/status`).set("Authorization", `Bearer ${staffMember.token}`).send({ status });

// hawaiian large 15.99 + deep dish 2.00 + bacon 1.25 + feta 2.25 = 21.49
// soda 20 oz 1.99 x 2 = 3.98            => total 25.47
const PIZZA_AND_SODAS = {
  customerName: "Ada",
  items: [
    { menuItemId: "hawaiian", quantity: 1, size: "large", crust: "deep dish", toppings: ["bacon", "feta"] },
    { menuItemId: "soda", quantity: 2, size: "20 oz" },
  ],
};
const ONE_SODA = { customerName: "Grace", items: [{ menuItemId: "soda", quantity: 1, size: "20 oz" }] };

describe("POST /orders", () => {
  it("stores the order and answers 201 with it, including the total", async () => {
    const res = await placeOrder(owner, PIZZA_AND_SODAS);
    expect(res.status).toBe(201);
    expect(res.body.customerName).toBe("Ada");
    expect(res.body.status).toBe("pending");
    expect(res.body.id).toMatch(/^[0-9a-f]{24}$/);
    expect(res.body.total).toBeCloseTo(25.47, 2);
  });

  it("records who placed it, from the token", async () => {
    const res = await placeOrder(owner, PIZZA_AND_SODAS);
    expect(res.body.customerId).toBe(owner.id);
  });

  it("ignores a customerId smuggled into the body", async () => {
    const res = await placeOrder(owner, { ...PIZZA_AND_SODAS, customerId: otherCustomer.id });
    expect(res.body.customerId).toBe(owner.id);
  });

  it("prices flat items, free crusts, and quantities correctly", async () => {
    // build-your-own medium 11.99 + thin 0 + mushroom 1.25 = 13.24 x 1
    // chocolate chip cookie 4.99 x 2 = 9.98        => total 23.22
    const res = await placeOrder(owner, {
      customerName: "Ada",
      items: [
        { menuItemId: "build-your-own", quantity: 1, size: "medium", crust: "thin", toppings: ["mushroom"] },
        { menuItemId: "chocolate-chip-cookie", quantity: 2 },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.total).toBeCloseTo(23.22, 2);
  });

  it("gives each order a distinct id", async () => {
    const first = await placeOrder(owner, PIZZA_AND_SODAS);
    const second = await placeOrder(owner, PIZZA_AND_SODAS);
    expect(first.body.id).not.toBe(second.body.id);
  });
});

describe("GET /orders", () => {
  it("is empty before anything is ordered", async () => {
    const res = await get(staffMember, "/orders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("shows staff everyone's orders", async () => {
    await placeOrder(owner, PIZZA_AND_SODAS);
    await placeOrder(otherCustomer, ONE_SODA);
    expect((await get(staffMember, "/orders")).body).toHaveLength(2);
  });

  it("shows a customer only their own orders", async () => {
    await placeOrder(owner, PIZZA_AND_SODAS);
    await placeOrder(otherCustomer, ONE_SODA);
    const res = await get(owner, "/orders");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customerId).toBe(owner.id);
  });

  it("filters by status for staff", async () => {
    await placeOrder(owner, PIZZA_AND_SODAS);
    expect((await get(staffMember, "/orders?status=pending")).body).toHaveLength(1);
    expect((await get(staffMember, "/orders?status=completed")).body).toEqual([]);
  });

  it("filters by status within a customer's own orders", async () => {
    const mine = await placeOrder(owner, PIZZA_AND_SODAS);
    await placeOrder(owner, PIZZA_AND_SODAS);
    await placeOrder(otherCustomer, ONE_SODA);
    await setStatus(mine.body.id, "completed");

    const pending = await get(owner, "/orders?status=pending");
    expect(pending.body).toHaveLength(1);
    expect(pending.body[0].customerId).toBe(owner.id);
  });
});

describe("GET /orders/:id", () => {
  it("lets the customer who placed it read it", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    const res = await get(owner, `/orders/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.total).toBeCloseTo(25.47, 2);
  });

  it("lets staff read anyone's", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    expect((await get(staffMember, `/orders/${created.body.id}`)).status).toBe(200);
  });

  it("403s for a customer reading someone else's", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    const res = await get(otherCustomer, `/orders/${created.body.id}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it("404s a well-formed id that matches nothing", async () => {
    const res = await get(staffMember, `/orders/${UNKNOWN_ORDER_ID}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("PATCH /orders/:id/status (staffMember)", () => {
  it("moves an order along and the change sticks", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    const patched = await setStatus(created.body.id, "in-progress");
    expect(patched.status).toBe(200);
    expect(patched.body.status).toBe("in-progress");
    expect((await get(staffMember, `/orders/${created.body.id}`)).body.status).toBe("in-progress");
  });

  it("rejects a status that is not on the list", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    const res = await setStatus(created.body.id, "yeeted");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("404s a well-formed id that matches nothing", async () => {
    expect((await setStatus(UNKNOWN_ORDER_ID, "completed")).status).toBe(404);
  });
});

describe("PATCH /orders/:id/cancel (the customer who placed it)", () => {
  it("cancels a pending order and the change sticks", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    const res = await cancel(owner, created.body.id);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
    expect((await get(owner, `/orders/${created.body.id}`)).body.status).toBe("cancelled");
  });

  it("403s for another customer, and leaves the order alone", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    expect((await cancel(otherCustomer, created.body.id)).status).toBe(403);
    expect((await get(staffMember, `/orders/${created.body.id}`)).body.status).toBe("pending");
  });

  it("409s once the kitchen has started", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    await setStatus(created.body.id, "in-progress");
    const res = await cancel(owner, created.body.id);
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it("409s the second time -- an order is cancelled only once", async () => {
    const created = await placeOrder(owner, PIZZA_AND_SODAS);
    await cancel(owner, created.body.id);
    expect((await cancel(owner, created.body.id)).status).toBe(409);
  });

  it("404s a well-formed id that matches nothing", async () => {
    expect((await cancel(owner, UNKNOWN_ORDER_ID)).status).toBe(404);
  });

  it("400s a malformed id", async () => {
    expect((await cancel(owner, MALFORMED_ORDER_ID)).status).toBe(400);
  });
});
