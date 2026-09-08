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
import { SellerEarningsPage } from '@/pages/seller/SellerEarningsPage';
import { AdminApplicationsPage } from '@/pages/admin/AdminApplicationsPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminReturnsPage } from '@/pages/admin/AdminReturnsPage';
import { AdminCouponsPage } from '@/pages/admin/AdminCouponsPage';
import { AdminSettlementsPage } from '@/pages/admin/AdminSettlementsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { SellerRoute } from './SellerRoute';
import { AdminRoute } from './AdminRoute';
import { SellerLayout } from '@/layouts/SellerLayout';
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

      <Route path="/seller" element={<SellerRoute />}>
        <Route element={<SellerLayout />}>
          <Route path="fulfillments" element={<SellerFulfillmentsPage />} />
          <Route path="earnings" element={<SellerEarningsPage />} />
        </Route>
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="settlements" element={<AdminSettlementsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
