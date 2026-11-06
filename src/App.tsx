import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from '@/pages/AdminPage';
import KioskPage from '@/pages/KioskPage';
import OrderStatusPage from '@/pages/OrderStatusPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';
import { BusinessLandingPage } from '@/pages/BusinessLandingPage';
import { SuperAdminPage } from '@/pages/SuperAdminPage';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';

export default function App() {
  return (
    <Routes>
      {/* Root redirect to default kiosk */}
      <Route path="/" element={<Navigate to={`/shop/${DEFAULT_SHOP_SLUG}`} replace />} />

      {/* Public Customer Kiosks */}
      <Route path="/shop/:shopSlug" element={<KioskPage />} />

      {/* Order Status Confirmation (Shop-Specific and Fallback) */}
      <Route path="/shop/:shopSlug/order/:orderId" element={<OrderStatusPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />

      {/* Shop-Specific Counter Admin Dashboards */}
      <Route path="/shop/:shopSlug/admin" element={<AdminPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Super Admin Master Panel */}
      <Route path="/super-admin" element={<SuperAdminPage />} />

      {/* Business Landing & Partner Registration */}
      <Route path="/for-business" element={<BusinessLandingPage />} />
      <Route path="/partner-register" element={<PartnerRegisterPage />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
