import { Router } from "express";
import {
  deleteMenuItem,
  getMenu,
  getMenuItem,
  patchMenuItem,
  postMenuItem,
} from "../controllers/menu-controller";
import { requireJwt } from "../middleware/require-jwt";
import { requireRole } from "../middleware/require-role";

// Routes are the thinnest layer in the app: which path, which method, which
// middleware, which controller. No logic. If a route handler has a body,
// something is in the wrong place.
//
// Menu routes: reads are open to everyone, writes are staff only -- a valid
// token (requireJwt) whose role is staff (requireRole).
// GET / and POST / share a path without colliding because a route is
// matched on method AND path.

export const menuRouter = Router();

menuRouter.get("/", getMenu);
menuRouter.get("/:id", getMenuItem);
menuRouter.post("/", requireJwt, requireRole("staff"), postMenuItem);
menuRouter.patch("/:id", requireJwt, requireRole("staff"), patchMenuItem);
menuRouter.delete("/:id", requireJwt, requireRole("staff"), deleteMenuItem);
