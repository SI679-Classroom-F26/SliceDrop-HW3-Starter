// Who may call what. 401 means "we don't know who you are" (no token, or a
// bad one); 403 means "we know, and you may not" (wrong role).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import {
  MALFORMED_ORDER_ID,
  UNKNOWN_ORDER_ID,
  createSignedInUser,
  resetData,
  signToken,
  startTestDb,
  stopTestDb,
} from "./mongo-helper";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

// The customer is a real user (placing an order credits their points);
// staff only ever needs a token here.
let customer: { id: string; token: string };
const staff = signToken("staff");

beforeEach(async () => {
  customer = await createSignedInUser("customer", "customer");
});
const bearer = (who: { token: string }) => `Bearer ${who.token}`;

const VALID_ORDER = { customerName: "Ada", items: [{ menuItemId: "soda", quantity: 1, size: "20 oz" }] };

describe("open routes stay open", () => {
  it("GET /menu needs no token", async () => {
    expect((await request(app).get("/menu")).status).toBe(200);
  });
});

describe("customer-only: POST /orders", () => {
  it("401s with no token", async () => {
    expect((await request(app).post("/orders").send(VALID_ORDER)).status).toBe(401);
  });

  it("401s for a token that is not a real JWT", async () => {
    const res = await request(app).post("/orders").set("Authorization", "Bearer nope").send(VALID_ORDER);
    expect(res.status).toBe(401);
  });

  it("403s for staff -- a valid token, the wrong role", async () => {
    const res = await request(app).post("/orders").set("Authorization", bearer(staff)).send(VALID_ORDER);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it("201s for a customer", async () => {
    const res = await request(app).post("/orders").set("Authorization", bearer(customer)).send(VALID_ORDER);
    expect(res.status).toBe(201);
  });
});

describe("customer or staff: reading orders", () => {
  it("GET /orders 401s with no token", async () => {
    expect((await request(app).get("/orders")).status).toBe(401);
  });

  it("GET /orders lets a customer in", async () => {
    expect((await request(app).get("/orders").set("Authorization", bearer(customer))).status).toBe(200);
  });

  it("GET /orders lets staff in", async () => {
    expect((await request(app).get("/orders").set("Authorization", bearer(staff))).status).toBe(200);
  });

  it("GET /orders/:id 401s with no token", async () => {
    expect((await request(app).get(`/orders/${UNKNOWN_ORDER_ID}`)).status).toBe(401);
  });
});

describe("staff-only and customer-only order changes", () => {
  it("PATCH /orders/:id/status 403s for a customer", async () => {
    const res = await request(app)
      .patch(`/orders/${UNKNOWN_ORDER_ID}/status`)
      .set("Authorization", bearer(customer))
      .send({ status: "completed" });
    expect(res.status).toBe(403);
  });

  it("PATCH /orders/:id/cancel 403s for staff -- staff use /status", async () => {
    const res = await request(app).patch(`/orders/${UNKNOWN_ORDER_ID}/cancel`).set("Authorization", bearer(staff));
    expect(res.status).toBe(403);
  });
});

describe("staff-only: menu writes", () => {
  const NEW_MENU_ITEM = { id: "garlic-knot", name: "Garlic Knot", category: "side", price: 1 };

  it("POST /menu 401s with no token", async () => {
    expect((await request(app).post("/menu").send(NEW_MENU_ITEM)).status).toBe(401);
  });

  it("POST /menu 403s for a customer", async () => {
    const res = await request(app).post("/menu").set("Authorization", bearer(customer)).send(NEW_MENU_ITEM);
    expect(res.status).toBe(403);
  });
});

describe("who-are-you comes before everything else about the request", () => {
  it("answers 401, not 400, for a bad body with no token", async () => {
    expect((await request(app).post("/orders").send({})).status).toBe(401);
  });

  it("answers 401, not 400, for a malformed order id with no token", async () => {
    expect((await request(app).get(`/orders/${MALFORMED_ORDER_ID}`)).status).toBe(401);
  });

  it("answers 403, not 400, for a malformed id on a route the role can't use", async () => {
    // requireRole sits before validateId: are-you-allowed before is-it-well-formed.
    const res = await request(app)
      .patch(`/orders/${MALFORMED_ORDER_ID}/status`)
      .set("Authorization", bearer(customer))
      .send({ status: "completed" });
    expect(res.status).toBe(403);
  });
});
