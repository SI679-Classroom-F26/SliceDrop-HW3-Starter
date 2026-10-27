// Menu CONTROLLERS: take what they need from the request, call the layers
// below, decide the status code. Named after the HTTP verbs they handle --
// the data-layer call inside speaks business language (findMenuItem,
// insertMenuItem), and importing that layer as a namespace keeps the two
// vocabularies from colliding: this file's deleteMenuItem handles the HTTP
// DELETE; menuRepository.deleteMenuItem removes the record.
// The HTTP world (req, res) ends in this file.
import { Request, Response } from "express";
import * as menuRepository from "../db/menu-repository";
import { MenuItem } from "../models/menu-item";
import { validateMenuItem } from "../validation/validate-menu-item";

// The two reads: optional ?category= filtering, and 404 on an unknown id.
export async function getMenu(req: Request, res: Response): Promise<void> {
  const category = req.query.category;

  if (typeof category === "string") {
    res.json(await menuRepository.getAllMenuItems(category));
    return;
  }

  res.json(await menuRepository.getAllMenuItems());
}

export async function getMenuItem(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const item = await menuRepository.findMenuItem(id);

  if (item === undefined) {
    res.status(404).json({ error: `No menu item with id "${id}".` });
    return;
  }

  res.json(item);
}

// postMenuItem -- POST /menu (staff). 400 with every problem, 409 when the
// id is taken, otherwise 201 with the new item.
export async function postMenuItem(req: Request, res: Response): Promise<void> {
  const errors = validateMenuItem(req.body, { partial: false });
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  const item: MenuItem = req.body;
  if ((await menuRepository.findMenuItem(item.id)) !== undefined) {
    res.status(409).json({ error: `A menu item with id "${item.id}" already exists.` });
    return;
  }

  await menuRepository.insertMenuItem(item);
  res.status(201).json(item);
}

// patchMenuItem -- PATCH /menu/:id (staff). A PATCH body is PARTIAL: only
// the provided fields change. The id comes from the URL; a body that tries
// to change it is ignored on that field.
export async function patchMenuItem(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const errors = validateMenuItem(req.body, { partial: true });
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  const { id: _ignored, ...changes } = req.body as Partial<MenuItem>;
  const updated = await menuRepository.updateMenuItem(id, changes);

  if (updated === undefined) {
    res.status(404).json({ error: `No menu item with id "${id}".` });
    return;
  }

  res.json(updated);
}

// deleteMenuItem -- DELETE /menu/:id (staff). 404 when nothing was there;
// 204 (No Content) on success -- done, and nothing to show you.
export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  if (!(await menuRepository.deleteMenuItem(id))) {
    res.status(404).json({ error: `No menu item with id "${id}".` });
    return;
  }

  res.status(204).end();
}
