import { Category } from "../models/menu-item";

// Validation for menu item bodies (POST /menu and PATCH /menu/:id).
// Same contract as validateOrder: a plain function, returns EVERY problem
// found, empty list means valid. No database access here -- whether an id
// is already taken is the controller's question (it answers 409); this
// file only judges the SHAPE of the body.
//
//   validateMenuItem(body, { partial: false })  -- POST: id, name, and
//     category are required
//   validateMenuItem(body, { partial: true })   -- PATCH: everything is
//     optional; only judge the fields that are present

// Types disappear at runtime, so the Category type cannot be asked for its
// members -- the list has to exist as a value.
const VALID_CATEGORIES: Category[] = ["pizza", "appetizer", "side", "beverage", "dessert"];

export function validateMenuItem(body: any, options: { partial: boolean }): string[] {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return ["Request body must be a JSON object."];
  }

  const errors: string[] = [];
  const required = !options.partial;

  for (const field of ["id", "name"]) {
    if (body[field] === undefined) {
      if (required) {
        errors.push(`${field} is required.`);
      }
    } else if (typeof body[field] !== "string" || body[field].trim() === "") {
      errors.push(`${field} must be a non-empty string.`);
    }
  }

  if (body.category === undefined) {
    if (required) {
      errors.push("category is required.");
    }
  } else if (!VALID_CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}.`);
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push("description must be a string.");
  }

  if (body.price !== undefined && (typeof body.price !== "number" || !(body.price > 0))) {
    errors.push("price must be a number greater than 0.");
  }

  for (const field of ["sizes", "toppings", "crusts"]) {
    if (body[field] !== undefined && !isPricedOptionList(body[field])) {
      errors.push(`${field} must be an array of { name: string, price: number >= 0 } objects.`);
    }
  }

  if (body.sauces !== undefined && !isStringList(body.sauces)) {
    errors.push("sauces must be an array of strings.");
  }

  return errors;
}

function isPricedOptionList(value: any): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (option) =>
        typeof option === "object" &&
        option !== null &&
        typeof option.name === "string" &&
        typeof option.price === "number" &&
        option.price >= 0,
    )
  );
}

function isStringList(value: any): boolean {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
