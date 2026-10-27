import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config";
import { AuthenticationError } from "../errors";

// TODO: requireJwt -- the lecture's middleware. Throw an AuthenticationError
// (401) when the Authorization header is missing or isn't `Bearer <token>`,
// and when jwt.verify rejects the token (bad signature, expired, not a JWT
// at all). Otherwise put the verified payload in res.locals.user -- where
// requireRole and the controllers will look for it -- and call next().
export function requireJwt(req: Request, res: Response, next: NextFunction): void {
  next();
}
