import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { HomePage } from '@/pages/customer/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProductListPage } from '@/pages/customer/ProductListPage';
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage';
import { CartPage } from '@/pages/customer/CartPage';
import { CheckoutPage } from '@/pages/customer/CheckoutPage';
import { OrdersPage } from '@/pages/customer/OrdersPage';
import { OrderDetailPage } from '@/pages/customer/OrderDetailPage';
import { SellerFulfillmentsPage } from '@/pages/seller/SellerFulfillmentsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { SellerRoute } from './SellerRoute';
import { SellerLayout } from '@/layouts/SellerLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>

      <Route path="/seller" element={<SellerRoute />}>
        <Route element={<SellerLayout />}>
          <Route path="fulfillments" element={<SellerFulfillmentsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
