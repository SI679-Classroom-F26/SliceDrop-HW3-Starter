import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetData, signToken, startTestDb, stopTestDb } from "./mongo-helper";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

const staffToken = signToken("staff").token;
const staff = () => `Bearer ${staffToken}`;

const NEW_ITEM = {
  id: "brownie",
  name: "Brownie",
  category: "dessert",
  price: 5.99,
};

describe("GET /menu", () => {
  it("returns the whole seeded menu", async () => {
    const res = await request(app).get("/menu");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(13);
  });

  it("filters by category, including the new dessert category", async () => {
    const res = await request(app).get("/menu?category=dessert");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((i: any) => i.category === "dessert")).toBe(true);
  });

  it("returns an empty array for an unknown category", async () => {
    const res = await request(app).get("/menu?category=seafood");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /menu/:id", () => {
  it("returns the item with its customization options", async () => {
    const res = await request(app).get("/menu/hawaiian");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Hawaiian");
    expect(res.body.sizes).toHaveLength(4);
    expect(res.body.crusts).toContainEqual({ name: "deep dish", price: 2.0 });
  });

  it("does not leak Mongo's _id into the response", async () => {
    const res = await request(app).get("/menu/hawaiian");
    expect(res.body._id).toBeUndefined();
  });

  it("404s an unknown id", async () => {
    const res = await request(app).get("/menu/sushi");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /menu", () => {
  it("creates an item we can then read back", async () => {
    const created = await request(app).post("/menu").set("Authorization", staff()).send(NEW_ITEM);
    expect(created.status).toBe(201);
    expect(created.body.id).toBe("brownie");

    const read = await request(app).get("/menu/brownie");
    expect(read.status).toBe(200);
    expect(read.body.name).toBe("Brownie");
  });

  it("rejects an invalid body with every problem listed", async () => {
    const res = await request(app)
      .post("/menu")
      .set("Authorization", staff())
      .send({ id: "", category: "cryptid", price: -3 });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("answers 409 when the id is already taken", async () => {
    const res = await request(app)
      .post("/menu")
      .set("Authorization", staff())
      .send({ ...NEW_ITEM, id: "hawaiian" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});

describe("PATCH /menu/:id", () => {
  it("updates only the provided fields", async () => {
    const res = await request(app)
      .patch("/menu/soda")
      .set("Authorization", staff())
      .send({ description: "Now with Dr. Pepper." });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Now with Dr. Pepper.");
    expect(res.body.sizes).toHaveLength(2); // untouched fields survive
  });

  it("rejects an invalid partial body", async () => {
    const res = await request(app)
      .patch("/menu/soda")
      .set("Authorization", staff())
      .send({ price: "free" });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("404s an unknown id", async () => {
    const res = await request(app)
      .patch("/menu/sushi")
      .set("Authorization", staff())
      .send({ price: 1.0 });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /menu/:id", () => {
  it("deletes: 204 with no body, and the item is gone", async () => {
    const res = await request(app).delete("/menu/soda").set("Authorization", staff());
    expect(res.status).toBe(204);

    const read = await request(app).get("/menu/soda");
    expect(read.status).toBe(404);
  });

  it("404s an unknown id", async () => {
    const res = await request(app).delete("/menu/sushi").set("Authorization", staff());
    expect(res.status).toBe(404);
  });
});
