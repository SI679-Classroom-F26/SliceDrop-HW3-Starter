// User CONTROLLERS. Same job as the others: build the Caller, call the
// service, choose the status code.
import { Request, Response } from "express";
import * as loyaltyService from "../services/loyalty-service";

// TODO: getUserPoints -- GET /users/:id/points. Build the Caller from
// res.locals.user (as in patchOrderCancel), ask loyaltyService.getPointsFor,
// and answer 200 with { userId, loyaltyPoints } -- or 404 when it comes back
// undefined. A 403 is thrown by the service.
export async function getUserPoints(req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: "TODO: not implemented yet." });
}
