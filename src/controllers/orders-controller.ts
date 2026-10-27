// Order CONTROLLERS. Same rules as the menu controllers: pull data from the
// request, call downward, choose the status code. Note what these do NOT
// do: no pricing (services), no Mongo (data), no field checking
// (validation). If you find yourself writing any of those here, it is in
// the wrong layer.
import { Request, Response } from "express";
import { VALID_STATUSES } from "../constants";
import * as ordersRepository from "../db/orders-repository";
import * as ordersService from "../services/orders-service";
import { OrderStatus } from "../models/order";
import { Caller } from "../models/user";
import { validateOrder } from "../validation/validate-order";

// TODO: postOrder -- POST /orders (customer). Validate first: 400 with
// { errors } when invalid. Then build the Caller from the
// token (res.locals.user -- patchOrderCancel below shows how) and hand it to
// ordersService.placeOrder with the body; 201 with the stored order.
export async function postOrder(req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: "TODO: not implemented yet." });
}

// TODO: getOrders -- GET /orders (customer or staff). Build the Caller and
// let ordersService.listOrdersFor decide what they see. ?status= still
// filters (it's a string when present).
export async function getOrders(req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: "TODO: not implemented yet." });
}

// TODO: getOrder -- GET /orders/:id (customer or staff). Build the Caller,
// ask ordersService.getOrderFor; 404 when it comes back undefined. A 403
// for someone else's order is THROWN by the service -- not your job here.
export async function getOrder(req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: "TODO: not implemented yet." });
}

// patchOrderStatus -- PATCH /orders/:id/status (staff). Body is
// { "status": "..." }; anything not in VALID_STATUSES is a 400.
export async function patchOrderStatus(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const status = req.body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as OrderStatus)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}.` });
    return;
  }

  // Checked above, so the cast is honest.
  const updated = await ordersRepository.updateOrderStatus(id, status as OrderStatus);

  if (updated === undefined) {
    res.status(404).json({ error: `No order with id "${id}".` });
    return;
  }

  res.json(updated);
}

// GIVEN: PATCH /orders/:id/cancel (customer). The Caller comes from the
// token that requireJwt verified; the service decides if they may cancel.
export async function patchOrderCancel(req: Request, res: Response): Promise<void> {
  const caller: Caller = { id: res.locals.user.sub, role: res.locals.user.role };
  const id = String(req.params.id);

  const cancelled = await ordersService.cancelOrder(caller, id);
  if (cancelled === undefined) {
    res.status(404).json({ error: `No order with id "${id}".` });
    return;
  }

  res.json(cancelled);
}
