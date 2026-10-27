// The menu the database is seeded with.
import type { CrustOption, MenuItem, ToppingOption } from "../models/menu-item";

const STANDARD_TOPPINGS: ToppingOption[] = [
  { name: "pepperoni", price: 1.25 },
  { name: "italian sausage", price: 1.25 },
  { name: "ham", price: 1.25 },
  { name: "onion", price: 1.25 },
  { name: "mushroom", price: 1.25 },
  { name: "green pepper", price: 1.25 },
  { name: "black olive", price: 1.25 },
  { name: "pineapple", price: 1.25 },
  { name: "bacon", price: 1.25 },
  { name: "banana peppers", price: 1.25 },
  { name: "garlic", price: 1.25 },
  { name: "basil", price: 1.25 },
  { name: "green olives", price: 1.25 },
];

const PREMIUM_TOPPINGS: ToppingOption[] = [
  { name: "feta", price: 2.25 },
  { name: "roast chicken", price: 2.25 },
  { name: "plant-based sausage", price: 2.25 },
];

const ALL_TOPPINGS: ToppingOption[] = [...STANDARD_TOPPINGS, ...PREMIUM_TOPPINGS];

// Crusts, and they are not all free.
const PIZZA_CRUSTS: CrustOption[] = [
  { name: "round", price: 0 },
  { name: "thin", price: 0 },
  { name: "deep dish", price: 2.0 },
  { name: "gluten free", price: 0 },
];

const DIPPING_SAUCES = ["marinara", "honey mustard", "ranch", "garlic butter"];

export const MENU_SEED: MenuItem[] = [
  {
    id: "hawaiian",
    name: "Hawaiian",
    category: "pizza",
    description: "Pineapple and ham.",
    sizes: [
      { name: "small", price: 11.99 },
      { name: "medium", price: 13.99 },
      { name: "large", price: 15.99 },
      { name: "xl", price: 17.99 },
    ],
    crusts: PIZZA_CRUSTS,
    toppings: ALL_TOPPINGS,
  },
  {
    id: "meat-lovers",
    name: "Meat Lovers",
    category: "pizza",
    description: "Pepperoni, italian sausage, and ham.",
    sizes: [
      { name: "small", price: 11.99 },
      { name: "medium", price: 13.99 },
      { name: "large", price: 15.99 },
      { name: "xl", price: 17.99 },
    ],
    crusts: PIZZA_CRUSTS,
    toppings: ALL_TOPPINGS,
  },
  {
    id: "mediterranean",
    name: "Mediterranean",
    category: "pizza",
    description: "Feta and banana peppers.",
    sizes: [
      { name: "small", price: 12.99 },
      { name: "medium", price: 14.99 },
      { name: "large", price: 16.99 },
      { name: "xl", price: 18.99 },
    ],
    crusts: PIZZA_CRUSTS,
    toppings: ALL_TOPPINGS,
  },
  {
    id: "build-your-own",
    name: "Build Your Own",
    category: "pizza",
    description: "Cheese pizza. Add your own toppings.",
    sizes: [
      { name: "small", price: 9.99 },
      { name: "medium", price: 11.99 },
      { name: "large", price: 13.99 },
      { name: "xl", price: 15.99 },
    ],
    crusts: PIZZA_CRUSTS,
    toppings: ALL_TOPPINGS,
  },
  {
    id: "bread-nugz",
    name: "Bread Nugz",
    category: "appetizer",
    description: "Comes with one sauce.",
    sizes: [
      { name: "12 pc", price: 6.99 },
      { name: "24 pc", price: 9.99 },
    ],
    sauces: DIPPING_SAUCES,
  },
  {
    id: "garlic-nugz",
    name: "Garlic Nugz",
    category: "appetizer",
    description: "Comes with one sauce.",
    sizes: [
      { name: "12 pc", price: 7.99 },
      { name: "24 pc", price: 10.99 },
    ],
    sauces: DIPPING_SAUCES,
  },
  {
    id: "cheezy-nugz",
    name: "Cheezy Nugz",
    category: "appetizer",
    description: "Comes with one sauce.",
    sizes: [
      { name: "12 pc", price: 8.99 },
      { name: "24 pc", price: 11.99 },
    ],
    sauces: DIPPING_SAUCES,
  },
  {
    id: "dipping-sauce",
    name: "Dipping Sauce",
    category: "side",
    price: 0.75,
    sauces: DIPPING_SAUCES,
  },
  {
    id: "soda",
    name: "Soda",
    category: "beverage",
    description: "Coke, Diet Coke, Sprite, Diet Sprite, or Lemonade.",
    sizes: [
      { name: "20 oz", price: 1.99 },
      { name: "2 liter", price: 3.99 },
    ],
  },
  {
    id: "cinnamon-nugz",
    name: "Cinnamon Nugz",
    category: "dessert",
    description: "With Vanilla Dipz.",
    sizes: [
      { name: "12 pc", price: 7.99 },
      { name: "24 pc", price: 10.99 },
    ],
  },
  {
    id: "chocolate-chip-cookie",
    name: "Chocolate Chip Cookie",
    category: "dessert",
    price: 4.99,
  },
  {
    id: "oatmeal-raisin-cookie",
    name: "Oatmeal Raisin Cookie",
    category: "dessert",
    price: 4.99,
  },
  {
    id: "snickerdoodle-cookie",
    name: "Snickerdoodle Cookie",
    category: "dessert",
    price: 4.99,
  },
];
