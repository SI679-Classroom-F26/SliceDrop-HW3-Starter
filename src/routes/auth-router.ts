import { Router } from "express";
import { getMe, postLogin, postRegister } from "../controllers/auth-controller";
import { requireJwt } from "../middleware/require-jwt";

// TODO: wire up the auth routes (the router is already mounted at /auth in
// app.ts):
//
//   POST /register    anyone            -> postRegister
//   POST /login       anyone            -> postLogin
//   GET  /me          any valid token   -> requireJwt, then getMe

export const authRouter = Router();
