// The loyalty program end to end: points earned by placing orders, taken
// back by cancelling, and readable by their owner or by staff.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import {
  MALFORMED_USER_ID,
  UNKNOWN_USER_ID,
  createSignedInUser,
  resetData,
  startTestDb,
  stopTestDb,
} from "./mongo-helper";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

type Who = { id: string; token: string };
let customer: Who;
let otherCustomer: Who;
let staffMember: Who;

beforeEach(async () => {
  customer = await createSignedInUser("customer", "customer");
  otherCustomer = await createSignedInUser("customer", "other-customer");
  staffMember = await createSignedInUser("staff", "staff-member");
});

// $25.47 -> 25 whole dollars -> 2500 points (total worked out in orders.e2e.test.ts)
const PIZZA_AND_SODAS = {
  customerName: "Ada",
  items: [
    { menuItemId: "hawaiian", quantity: 1, size: "large", crust: "deep dish", toppings: ["bacon", "feta"] },
    { menuItemId: "soda", quantity: 2, size: "20 oz" },
  ],
};
const PIZZA_AND_SODAS_POINTS = 2500;

// $1.99 -> 1 whole dollar -> 100 points
const ONE_SODA = { customerName: "Ada", items: [{ menuItemId: "soda", quantity: 1, size: "20 oz" }] };
const ONE_SODA_POINTS = 100;

const placeOrder = (who: Who, body: object) =>
  request(app).post("/orders").set("Authorization", `Bearer ${who.token}`).send(body);
const cancel = (who: Who, orderId: string) =>
  request(app).patch(`/orders/${orderId}/cancel`).set("Authorization", `Bearer ${who.token}`);
const pointsOf = (userId: string, asker: Who) =>
  request(app).get(`/users/${userId}/points`).set("Authorization", `Bearer ${asker.token}`);

describe("earning points", () => {
  it("starts a new customer at 0", async () => {
    const res = await pointsOf(customer.id, customer);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: customer.id, loyaltyPoints: 0 });
  });

  it("records on the order the points it earned", async () => {
    const res = await placeOrder(customer, PIZZA_AND_SODAS);
    expect(res.body.pointsEarned).toBe(PIZZA_AND_SODAS_POINTS);
  });

  it("credits the customer who placed the order", async () => {
    await placeOrder(customer, PIZZA_AND_SODAS);
    expect((await pointsOf(customer.id, customer)).body.loyaltyPoints).toBe(PIZZA_AND_SODAS_POINTS);
  });

  it("adds up across orders, and credits no one else", async () => {
    await placeOrder(customer, PIZZA_AND_SODAS);
    await placeOrder(customer, ONE_SODA);
    expect((await pointsOf(customer.id, customer)).body.loyaltyPoints).toBe(PIZZA_AND_SODAS_POINTS + ONE_SODA_POINTS);
    expect((await pointsOf(otherCustomer.id, otherCustomer)).body.loyaltyPoints).toBe(0);
  });

  it("works for a customer who signed up through /auth", async () => {
    const credentials = { username: "new-customer", password: "new-customer-password" };
    const registered = await request(app).post("/auth/register").send(credentials);
    const { body } = await request(app).post("/auth/login").send(credentials);
    const newCustomer = { id: registered.body.id, token: body.token };

    await placeOrder(newCustomer, ONE_SODA);
    expect((await pointsOf(newCustomer.id, newCustomer)).body.loyaltyPoints).toBe(ONE_SODA_POINTS);
  });
});

describe("cancelling takes points back", () => {
  it("removes exactly the cancelled order's points", async () => {
    const kept = await placeOrder(customer, PIZZA_AND_SODAS);
    const cancelled = await placeOrder(customer, ONE_SODA);
    await cancel(customer, cancelled.body.id);

    expect(kept.status).toBe(201);
    expect((await pointsOf(customer.id, customer)).body.loyaltyPoints).toBe(PIZZA_AND_SODAS_POINTS);
  });

  it("leaves points alone when the cancel is refused", async () => {
    const order = await placeOrder(customer, PIZZA_AND_SODAS);
    await cancel(otherCustomer, order.body.id); // not theirs: 403
    expect((await pointsOf(customer.id, customer)).body.loyaltyPoints).toBe(PIZZA_AND_SODAS_POINTS);
  });

  it("takes them back only once, however many times cancel is sent", async () => {
    const order = await placeOrder(customer, PIZZA_AND_SODAS);
    await cancel(customer, order.body.id);
    await cancel(customer, order.body.id); // already cancelled: 409
    expect((await pointsOf(customer.id, customer)).body.loyaltyPoints).toBe(0);
  });
});

describe("GET /users/:id/points -- who may look", () => {
  it("403s for a customer reading someone else's points", async () => {
    const res = await pointsOf(otherCustomer.id, customer);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it("lets staff read anyone's", async () => {
    await placeOrder(customer, ONE_SODA);
    const res = await pointsOf(customer.id, staffMember);
    expect(res.status).toBe(200);
    expect(res.body.loyaltyPoints).toBe(ONE_SODA_POINTS);
  });

  it("404s a well-formed id that matches no user", async () => {
    expect((await pointsOf(UNKNOWN_USER_ID, staffMember)).status).toBe(404);
  });

  it("400s a malformed id", async () => {
    expect((await pointsOf(MALFORMED_USER_ID, staffMember)).status).toBe(400);
  });

  it("401s with no token", async () => {
    expect((await request(app).get(`/users/${customer.id}/points`)).status).toBe(401);
  });
});
