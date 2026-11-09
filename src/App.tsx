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
      {/* Root domain (https://rtsprint.online) now opens your professional Business Landing Page */}
      <Route path="/" element={<BusinessLandingPage />} />
      <Route path="/for-business" element={<BusinessLandingPage />} />

      {/* Super Admin Master Panel (Placed before shop routes so it never gets blocked) */}
      <Route path="/super-admin" element={<SuperAdminPage />} />

      {/* Public Customer Kiosks */}
      <Route path="/shop/:shopSlug" element={<KioskPage />} />

      {/* Order Status Confirmation (Shop-Specific and Fallback) */}
      <Route path="/shop/:shopSlug/order/:orderId" element={<OrderStatusPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />

      {/* Shop-Specific Counter Admin Dashboards */}
      <Route path="/shop/:shopSlug/admin" element={<AdminPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Partner Registration */}
      <Route path="/partner-register" element={<PartnerRegisterPage />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
