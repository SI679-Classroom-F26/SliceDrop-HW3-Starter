// Unit tests for the loyalty service: the points math, the read-add-write
// on a user's total, and who may see whose points -- with the users
// repository faked, so these never touch a database.
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as usersRepository from "../db/users-repository";
import { AuthorizationError } from "../errors";
import type { Caller, User } from "../models/user";
import * as loyaltyService from "../services/loyalty-service";

beforeEach(() => {
  vi.restoreAllMocks();
});

// No database here, so ids only need to be distinct, not real ObjectIds.
const CUSTOMER_ID = "customer-id";
const OTHER_CUSTOMER_ID = "other-customer-id";
const STAFF_ID = "staff-id";

const customer: Caller = { id: CUSTOMER_ID, role: "customer" };
const staffMember: Caller = { id: STAFF_ID, role: "staff" };

// A customer as the repository hands it back.
const makeUser = (loyaltyPoints: number): User => ({
  id: CUSTOMER_ID,
  username: "customer",
  hashedPassword: "$2b$11$not-a-real-hash",
  role: "customer",
  loyaltyPoints,
});

describe("calculatePoints", () => {
  it("earns 100 points per dollar", () => {
    expect(loyaltyService.calculatePoints(12)).toBe(1200);
  });

  it("drops the cents before multiplying -- rounds down, never up", () => {
    expect(loyaltyService.calculatePoints(19.99)).toBe(1900);
  });

  it("earns nothing for a total under a dollar", () => {
    expect(loyaltyService.calculatePoints(0.75)).toBe(0);
  });
});

describe("addPoints", () => {
  it("saves the current total plus what was earned", async () => {
    vi.spyOn(usersRepository, "findUser").mockResolvedValue(makeUser(500));
    const save = vi.spyOn(usersRepository, "setLoyaltyPoints").mockResolvedValue();

    await loyaltyService.addPoints(CUSTOMER_ID, 250);

    expect(save).toHaveBeenCalledWith(CUSTOMER_ID, 750);
  });

  it("subtracts when the change is negative", async () => {
    vi.spyOn(usersRepository, "findUser").mockResolvedValue(makeUser(500));
    const save = vi.spyOn(usersRepository, "setLoyaltyPoints").mockResolvedValue();

    await loyaltyService.addPoints(CUSTOMER_ID, -200);

    expect(save).toHaveBeenCalledWith(CUSTOMER_ID, 300);
  });

  it("throws, and saves nothing, when the user doesn't exist", async () => {
    const findUser = vi.spyOn(usersRepository, "findUser").mockResolvedValue(undefined);
    const save = vi.spyOn(usersRepository, "setLoyaltyPoints");

    await expect(loyaltyService.addPoints(CUSTOMER_ID, 250)).rejects.toThrow();
    expect(findUser).toHaveBeenCalledWith(CUSTOMER_ID);
    expect(save).not.toHaveBeenCalled();
  });
});

describe("getPointsFor", () => {
  it("never looks anyone up when a customer asks about someone else", async () => {
    const findUser = vi.spyOn(usersRepository, "findUser").mockResolvedValue(makeUser(500));

    await expect(loyaltyService.getPointsFor(customer, OTHER_CUSTOMER_ID)).rejects.toThrow(AuthorizationError);
    expect(findUser).not.toHaveBeenCalled();
  });

  it("gives a customer their own points", async () => {
    vi.spyOn(usersRepository, "findUser").mockResolvedValue(makeUser(500));
    expect(await loyaltyService.getPointsFor(customer, CUSTOMER_ID)).toBe(500);
  });

  it("lets staff read anyone's, looking up exactly that id", async () => {
    const findUser = vi.spyOn(usersRepository, "findUser").mockResolvedValue(makeUser(500));

    expect(await loyaltyService.getPointsFor(staffMember, CUSTOMER_ID)).toBe(500);
    expect(findUser).toHaveBeenCalledWith(CUSTOMER_ID);
  });

  it("returns undefined for a user that doesn't exist", async () => {
    vi.spyOn(usersRepository, "findUser").mockResolvedValue(undefined);
    expect(await loyaltyService.getPointsFor(staffMember, CUSTOMER_ID)).toBeUndefined();
  });
});
