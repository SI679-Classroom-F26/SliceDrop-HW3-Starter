// The auth SERVICE: registering and logging in. No req/res here -- the
// controller hands over plain values, and problems are THROWN as the error
// classes from errors.ts. The error handler in app.ts turns each one into
// its status code, so this file never has to know HTTP exists.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SALT_ROUNDS } from "../constants";
import { getJwtSecret } from "../config";
import * as usersRepository from "../db/users-repository";
import { AuthenticationError, ConflictError, ValidationError } from "../errors";
import { PublicUser } from "../models/user";

// TODO: registerUser -- POST /auth/register, the week 6 lecture's version
// with one tightening:
//   - username and password must both be NON-EMPTY STRINGS, or throw a
//     ValidationError (400). `!username` alone is not enough: a JSON body
//     can send 42 or {} where you expected text.
//   - a taken username throws a ConflictError (409)
//   - hash the password with bcrypt (SALT_ROUNDS is in constants.ts) and
//     save the user with usersRepository.insertUser. Everyone who registers
//     is a customer -- whatever the body says.
//   - return a PublicUser: never the hashedPassword.
export async function registerUser(username: string, password: string): Promise<PublicUser> {
  throw new Error("TODO: registerUser");
}

// TODO: logIn -- POST /auth/login. Returns a signed JWT.
//   - a username or password that is not a string is an AuthenticationError
//     (401). Passing non-strings to the database can cause problems, so make
//     sure that can't happen.
//   - unknown username and wrong password throw the SAME AuthenticationError
//     with the SAME message. Telling them apart helps an attacker.
//   - bcrypt.compare checks the password against the stored hash.
//   - sign { sub: user.id, username: user.username, role: user.role } with
//     getJwtSecret(), expiring in 1h. The role goes in the token so later
//     requests can be authorized without another trip to the database.
export async function logIn(username: string, password: string): Promise<string> {
  throw new Error("TODO: logIn");
}
