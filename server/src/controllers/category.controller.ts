import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { sendSuccess } from '../utils/response';

export async function listHandler(_req: Request, res: Response) {
  const categories = await categoryService.listCategories();
  return sendSuccess(res, categories);
}

export async function createHandler(req: Request, res: Response) {
  const category = await categoryService.createCategory(req.body);
  return sendSuccess(res, category, 201);
}

export async function updateHandler(req: Request, res: Response) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, category);
}

export async function deleteHandler(req: Request, res: Response) {
  await categoryService.softDeleteCategory(req.params.id, req.user!.sub);
  return sendSuccess(res, { deleted: true });
}
