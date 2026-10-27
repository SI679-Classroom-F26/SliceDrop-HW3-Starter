import { Router } from "express";
import {
  getOrder,
  getOrders,
  patchOrderCancel,
  patchOrderStatus,
  postOrder,
} from "../controllers/orders-controller";
import { requireJwt } from "../middleware/require-jwt";
import { requireRole } from "../middleware/require-role";
import { validateId } from "../middleware/validate-id";

// TODO: the shared secrets are gone. Re-wire the four order routes with
// requireJwt and requireRole, in the same order every time: who-are-you
// (requireJwt), then are-you-allowed (requireRole), then is-the-request-
// well-formed (validateId, on the /:id routes), then the controller.
//
//   POST  /             customer            -> postOrder
//   GET   /             customer or staff   -> getOrders
//   GET   /:id          customer or staff   -> getOrder
//   PATCH /:id/status   staff               -> patchOrderStatus
//
// Customers can now reach their own orders: requireRole only says WHICH
// roles get through; the service decides WHICH orders they see.

export const ordersRouter = Router();

// GIVEN: customers cancel their own pending orders.
ordersRouter.patch("/:id/cancel", requireJwt, requireRole("customer"), validateId, patchOrderCancel);
