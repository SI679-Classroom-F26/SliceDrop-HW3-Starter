// Auth CONTROLLERS. Thin on purpose: pull values off the request, call the
// service, choose the success status. Failures arrive as thrown errors and
// never pass through here -- Express hands them to the error handler.
import { Request, Response } from "express";
import * as authService from "../services/auth-service";

// TODO: postRegister -- POST /auth/register. Register the user through the
// auth service; 201 with the new user.
export async function postRegister(req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: "TODO: not implemented yet." });
}

// TODO: postLogin -- POST /auth/login. Log in through the auth service. A
// successful login is a 200 with { token }. A failed one is thrown by the
// service as a 401, and the error handler answers it -- not this function.
export async function postLogin(req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: "TODO: not implemented yet." });
}

// TODO: getMe -- GET /auth/me. requireJwt has already verified the token and
// left its payload in res.locals.user: answer with it.
export function getMe(req: Request, res: Response): void {
  res.status(501).json({ error: "TODO: not implemented yet." });
}
