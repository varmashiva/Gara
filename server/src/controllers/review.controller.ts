import { Request, Response } from 'express';
import * as reviewService from '../services/review.service';
import { sendSuccess } from '../utils/response';

export async function createHandler(req: Request, res: Response) {
  const review = await reviewService.createReview(req.user!.sub, req.body);
  return sendSuccess(res, review, 201);
}

export async function listForProductHandler(req: Request, res: Response) {
  const reviews = await reviewService.listProductReviews(req.params.productId);
  return sendSuccess(res, reviews);
}

export async function listForAdminHandler(_req: Request, res: Response) {
  const reviews = await reviewService.listAllReviewsForAdmin();
  return sendSuccess(res, reviews);
}

export async function moderateHandler(req: Request, res: Response) {
  const review = await reviewService.moderateReview(req.params.id, req.body.status);
  return sendSuccess(res, review);
}
