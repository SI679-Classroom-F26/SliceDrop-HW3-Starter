// Secrets do NOT live here: the JWT secret comes from the environment (see
// config.ts and .env.example). The connection string below should too, and
// will once we deploy.

export const PORT = 3000;

export const MONGO_URI = "mongodb://127.0.0.1:27017";
export const DB_NAME = "slicedrop";

export const MENU_COLLECTION = "menu";
export const ORDERS_COLLECTION = "orders";
export const USERS_COLLECTION = "users";

// bcrypt cost: 2^11 rounds of work. Unnoticeable for one login, crippling
// for an attacker trying millions of guesses.
export const SALT_ROUNDS = 11;

// Every status an order can hold. PATCH /orders/:id/status must reject
// anything not on this list.
import type { OrderStatus } from "./models/order";
export const VALID_STATUSES: OrderStatus[] = ["pending", "cancelled", "in-progress", "completed"];
