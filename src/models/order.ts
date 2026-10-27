// The order model.

export type OrderStatus = "pending" | "cancelled" | "in-progress" | "completed";

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  size?: string;
  crust?: string;
  sauce?: string;
  toppings?: string[];
}

/** What a customer sends to POST /orders. */
export interface NewOrder {
  customerName: string;
  items: OrderItem[];
}

/** What the server stores and returns. */
export interface Order extends NewOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  // The price of the whole order, computed by the services layer when the
  // order is placed and stored with it forever.
  // An order is a receipt -- if menu prices change next week, this order
  // still cost what it cost.
  total: number;
  // GIVEN (new in HW3): who placed the order -- the id from their token, never
  // from the request body. Ownership checks compare against this.
  customerId: string;
  // GIVEN (new in HW3, loyalty): the points this order earned, worked out
  // when it was placed and stored with it -- like total, it's a receipt.
  // Cancelling takes back exactly this many.
  pointsEarned: number;
}
