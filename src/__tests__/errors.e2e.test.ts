import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../app";
import { MALFORMED_ORDER_ID, resetData, signToken, startTestDb, stopTestDb } from "./mongo-helper";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

const CUSTOMER_TOKEN = signToken("customer").token;
const STAFF_TOKEN = signToken("staff").token;

const asCustomer = () => request(app).post("/orders").set("Authorization", `Bearer ${CUSTOMER_TOKEN}`);

describe("404", () => {
  it("answers a path no router handles", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("400 on an invalid order", () => {
  it("reports every problem it found, not just the first", async () => {
    const res = await asCustomer().send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects an unknown menu item", async () => {
    const res = await asCustomer().send({ customerName: "Ada", items: [{ menuItemId: "sushi", quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it("rejects a crust the item does not offer", async () => {
    const res = await asCustomer().send({
      customerName: "Ada",
      items: [{ menuItemId: "hawaiian", quantity: 1, crust: "stuffed" }],
    });
    expect(res.status).toBe(400);
  });

  it("rejects a size the item does not offer", async () => {
    const res = await asCustomer().send({
      customerName: "Ada",
      items: [{ menuItemId: "soda", quantity: 1, size: "bathtub" }],
    });
    expect(res.status).toBe(400);
  });
});

describe("400 on a malformed order id", () => {
  it("turns the id away before it can reach the database", async () => {
    const res = await request(app)
      .get(`/orders/${MALFORMED_ORDER_ID}`)
      .set("Authorization", `Bearer ${STAFF_TOKEN}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe("500 when our own code throws", () => {
  // Forcing a real server-side crash: make the data layer's addOrder blow
  // up, then send a perfectly valid request. A 400 here would mean the
  // error handler is blaming the client for our bug.
  it("does not report a server crash as a client error", async () => {
    vi.resetModules();
    vi.doMock("../db/orders-repository", async () => {
      const real = await vi.importActual<typeof import("../db/orders-repository")>("../db/orders-repository");
      return { ...real, addOrder: () => { throw new Error("boom"); } };
    });

    // A dynamic import() is ESM, and under NodeNext those need the file
    // extension -- unlike the static imports at the top of this file.
    const { app: freshApp } = await import("../app.js");
    const res = await request(freshApp)
      .post("/orders")
      .set("Authorization", `Bearer ${CUSTOMER_TOKEN}`)
      .send({ customerName: "Ada", items: [{ menuItemId: "soda", quantity: 1, size: "20 oz" }] });

    vi.doUnmock("../db/orders-repository");
    vi.resetModules();

    expect(res.status).toBe(500);
  });
});

describe("400 on malformed JSON", () => {
  it("answers the client, not a crash", async () => {
    const res = await asCustomer().set("Content-Type", "application/json").send("{nope");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
