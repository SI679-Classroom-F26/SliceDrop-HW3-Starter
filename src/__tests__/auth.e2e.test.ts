import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../app";
import { getJwtSecret } from "../config";
import { findUserByUsername } from "../db/users-repository";
import { createUser, resetData, startTestDb, stopTestDb } from "./mongo-helper";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

// Someone signing up for the first time.
const NEW_USER = { username: "ada", password: "correct-password" };
const WRONG_PASSWORD = "wrong-password";

// The only way to get a staff account is to put one in the database.
const STAFF_USER = { username: "staff", password: "staff-password" };

const register = (body: object) => request(app).post("/auth/register").send(body);
const login = (body: object) => request(app).post("/auth/login").send(body);
const me = (token?: string) => {
  const req = request(app).get("/auth/me");
  return token === undefined ? req : req.set("Authorization", `Bearer ${token}`);
};

describe("POST /auth/register", () => {
  it("creates a customer and answers 201 without any password", async () => {
    const res = await register(NEW_USER);
    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^[0-9a-f]{24}$/);
    expect(res.body.username).toBe(NEW_USER.username);
    expect(res.body.role).toBe("customer");
    expect(res.body.password).toBeUndefined();
    expect(res.body.hashedPassword).toBeUndefined();
  });

  it("stores a bcrypt hash, never the password itself", async () => {
    await register(NEW_USER);
    const stored = await findUserByUsername(NEW_USER.username);
    expect(stored?.hashedPassword).not.toBe(NEW_USER.password);
    expect(await bcrypt.compare(NEW_USER.password, stored!.hashedPassword)).toBe(true);
  });

  it("makes a customer even when the body asks to be staff", async () => {
    const res = await register({ ...NEW_USER, role: "staff" });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("customer");
  });

  it("answers 409 for a username that is taken", async () => {
    await register(NEW_USER);
    const res = await register({ username: NEW_USER.username, password: "a-different-password" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it("answers 400 when the password is missing", async () => {
    const res = await register({ username: NEW_USER.username });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("answers 400 when the username is not a string", async () => {
    const res = await register({ username: 42, password: NEW_USER.password });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("answers 200 with a token that says who logged in", async () => {
    const registered = await register(NEW_USER);
    const res = await login(NEW_USER);
    expect(res.status).toBe(200);

    const payload = jwt.verify(res.body.token, getJwtSecret()) as jwt.JwtPayload;
    expect(payload.sub).toBe(registered.body.id);
    expect(payload.username).toBe(NEW_USER.username);
    expect(payload.role).toBe("customer");
    expect(payload.exp).toBeDefined();
  });

  it("puts the staff role in a staff member's token", async () => {
    await createUser(STAFF_USER.username, STAFF_USER.password, "staff");
    const res = await login(STAFF_USER);
    const payload = jwt.verify(res.body.token, getJwtSecret()) as jwt.JwtPayload;
    expect(payload.role).toBe("staff");
  });

  it("answers 401 for a wrong password and an unknown user -- with the same message", async () => {
    await register(NEW_USER);
    const wrongPassword = await login({ username: NEW_USER.username, password: WRONG_PASSWORD });
    const unknownUser = await login({ username: "nobody-by-this-name", password: NEW_USER.password });
    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownUser.body.error);
  });

  it("answers 401 when the username is a Mongo query instead of a name", async () => {
    await createUser(STAFF_USER.username, STAFF_USER.password, "staff");
    // { $gt: "" } matches ANY username if it reaches findOne unchecked.
    const res = await login({ username: { $gt: "" }, password: STAFF_USER.password });
    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  // A token we sign ourselves -- no database user behind it is needed,
  // because requireJwt only checks the signature and expiry.
  const TOKEN_USER_ID = "650000000000000000000001";
  const TOKEN_PAYLOAD = { sub: TOKEN_USER_ID, username: "token-user", role: "customer" };

  it("200s with the username for a token we sign ourselves", async () => {
    const res = await me(jwt.sign(TOKEN_PAYLOAD, getJwtSecret()));
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(TOKEN_PAYLOAD.username);
    expect(res.body.role).toBe(TOKEN_PAYLOAD.role);
  });

  it("401s when there is no token", async () => {
    const res = await me();
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("401s for a token that is not a JWT at all", async () => {
    expect((await me("not-a-jwt")).status).toBe(401);
  });

  it("401s for a token signed with the wrong secret", async () => {
    expect((await me(jwt.sign(TOKEN_PAYLOAD, "not-our-secret"))).status).toBe(401);
  });

  it("401s for a token that has expired", async () => {
    const expired = jwt.sign(TOKEN_PAYLOAD, getJwtSecret(), { expiresIn: -10 });
    expect((await me(expired)).status).toBe(401);
  });

  it("401s for a token whose payload has been edited", async () => {
    // Keep the real header and signature; swap in a payload that says staff.
    const [header, , signature] = jwt.sign(TOKEN_PAYLOAD, getJwtSecret()).split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ ...TOKEN_PAYLOAD, role: "staff" })).toString("base64url");
    expect((await me(`${header}.${forgedPayload}.${signature}`)).status).toBe(401);
  });

  it("200s for a token from a real register-then-login", async () => {
    await register(NEW_USER);
    const { body } = await login(NEW_USER);
    const res = await me(body.token);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(NEW_USER.username);
  });
});
