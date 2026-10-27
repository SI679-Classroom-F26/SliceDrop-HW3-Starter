// The menu item model: the shapes the whole app agrees on for menu data.
//
// Crusts carry a price (Deep Dish is +$2.00) -- the same { name, price }
// shape a topping has.

export type Category = "pizza" | "appetizer" | "side" | "beverage" | "dessert";

export interface SizeOption {
  name: string;
  price: number;
}

export interface ToppingOption {
  name: string;
  price: number;
}

export interface CrustOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  description?: string;
  /** Flat price, for items that do not come in sizes. */
  price?: number;
  /** The option lists below are present only when they apply to the item. */
  sizes?: SizeOption[];
  crusts?: CrustOption[];
  sauces?: string[];
  toppings?: ToppingOption[];
}

