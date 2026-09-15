import { Request, Response } from 'express';
import * as productService from '../services/product.service';
import { sendSuccess } from '../utils/response';
import { ProductQueryInput } from '../schemas/product.schema';

export async function listPublicHandler(req: Request, res: Response) {
  const query = req.query as unknown as ProductQueryInput;
  const result = await productService.listPublicProducts(query);
  return sendSuccess(res, result);
}

export async function getPublicHandler(req: Request, res: Response) {
  const product = await productService.getPublicProductById(req.params.id);
  return sendSuccess(res, product);
}

export async function listMineHandler(req: Request, res: Response) {
  const products = await productService.listMyProducts(req.user!.sub);
  return sendSuccess(res, products);
}

export async function createHandler(req: Request, res: Response) {
  const product = await productService.createProduct(req.user!.sub, req.body);
  return sendSuccess(res, product, 201);
}

export async function updateHandler(req: Request, res: Response) {
  const product = await productService.updateProduct(req.user!.sub, req.params.id, req.body);
  return sendSuccess(res, product);
}

export async function submitForReviewHandler(req: Request, res: Response) {
  const product = await productService.submitForReview(req.user!.sub, req.params.id);
  return sendSuccess(res, product);
}

export async function deactivateHandler(req: Request, res: Response) {
  const product = await productService.deactivateProduct(req.user!.sub, req.params.id);
  return sendSuccess(res, product);
}

export async function reactivateHandler(req: Request, res: Response) {
  const product = await productService.reactivateProduct(req.user!.sub, req.params.id);
  return sendSuccess(res, product);
}

export async function deleteHandler(req: Request, res: Response) {
  await productService.deleteProduct(req.user!.sub, req.params.id);
  return sendSuccess(res, { deleted: true });
}

export async function listForModerationHandler(req: Request, res: Response) {
  const status = req.query.status as 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | undefined;
  const products = await productService.listForModeration(status);
  return sendSuccess(res, products);
}

export async function decideStatusHandler(req: Request, res: Response) {
  const product = await productService.decideProductStatus(req.user!.sub, req.params.id, req.body);
  return sendSuccess(res, product);
}

export async function adminCreateHandler(req: Request, res: Response) {
  const product = await productService.adminCreateProduct(req.user!.sub, req.body);
  return sendSuccess(res, product, 201);
}

export async function adminUpdateHandler(req: Request, res: Response) {
  const product = await productService.adminUpdateProduct(req.user!.sub, req.params.id, req.body);
  return sendSuccess(res, product);
}

export async function adminDeleteHandler(req: Request, res: Response) {
  await productService.adminDeleteProduct(req.user!.sub, req.params.id);
  return sendSuccess(res, { deleted: true });
}

export async function addImageHandler(req: Request, res: Response) {
  const product = await productService.addProductImage(req.user!.sub, req.params.id, req.file!);
  return sendSuccess(res, product, 201);
}

export async function removeImageHandler(req: Request, res: Response) {
  const product = await productService.removeProductImage(req.user!.sub, req.params.id, req.params.publicId);
  return sendSuccess(res, product);
}
