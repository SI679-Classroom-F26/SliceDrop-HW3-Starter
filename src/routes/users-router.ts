import { Router } from "express";
import { getUserPoints } from "../controllers/users-controller";
import { requireJwt } from "../middleware/require-jwt";
import { validateId } from "../middleware/validate-id";

// TODO: wire up the users route (mounted at /users in app.ts):
//
//   GET /:id/points    any valid token   -> requireJwt, validateId, getUserPoints
//
// No requireRole: both roles may call it, and WHOSE points they may see is
// the service's decision -- exactly like the lecture's GET /users/:id.

export const usersRouter = Router();
