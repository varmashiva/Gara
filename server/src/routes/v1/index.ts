import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { sellerRouter } from './seller.routes';
import { adminRouter } from './admin.routes';
import { categoryRouter } from './category.routes';
import { productRouter } from './product.routes';
import { cartRouter } from './cart.routes';
import { wishlistRouter } from './wishlist.routes';

export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/seller', sellerRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/categories', categoryRouter);
v1Router.use('/products', productRouter);
v1Router.use('/cart', cartRouter);
v1Router.use('/wishlist', wishlistRouter);
