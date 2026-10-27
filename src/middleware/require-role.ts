import { NextFunction, Request, Response } from "express";
import { AuthorizationError } from "../errors";
import { Role } from "../models/user";

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

// TODO: requireRole(...allowed) -- a middleware FACTORY, like the lecture's,
// except it takes any number of roles: requireRole("staff") or
// requireRole("customer", "staff"). The middleware it returns throws an
// AuthorizationError (403) unless res.locals.user.role is one of `allowed`.
// It always runs AFTER requireJwt -- that is what put res.locals.user there.
export function requireRole(...allowed: Role[]): Middleware {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();
  };
}
