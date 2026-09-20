import { Routes, Route, Navigate } from 'react-router-dom';
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
import { AdminHeroPage } from '@/pages/admin/AdminHeroPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage';
import { AdminReturnsPage } from '@/pages/admin/AdminReturnsPage';
import { AdminCouponsPage } from '@/pages/admin/AdminCouponsPage';
import { AdminSettlementsPage } from '@/pages/admin/AdminSettlementsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '@/layouts/AdminLayout';

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

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="hero" element={<AdminHeroPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="settlements" element={<AdminSettlementsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
