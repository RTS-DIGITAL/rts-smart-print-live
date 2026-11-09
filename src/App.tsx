import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from '@/pages/AdminPage';
import KioskPage from '@/pages/KioskPage';
import OrderStatusPage from '@/pages/OrderStatusPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';
import { BusinessLandingPage } from '@/pages/BusinessLandingPage';
import { SuperAdminPage } from '@/pages/SuperAdminPage';

export default function App() {
  return (
    <Routes>
      {/* 1. Super Admin Master Panel */}
      <Route path="/super-admin" element={<SuperAdminPage />} />

      {/* 2. Root domain (https://rtsprint.online) opens your professional Business Landing Page */}
      <Route path="/" element={<BusinessLandingPage />} />
      <Route path="/for-business" element={<BusinessLandingPage />} />

      {/* 3. Public Customer Kiosks */}
      <Route path="/shop/:shopSlug" element={<KioskPage />} />

      {/* 4. Order Status Confirmation */}
      <Route path="/shop/:shopSlug/order/:orderId" element={<OrderStatusPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />

      {/* 5. Shop-Specific Counter Admin Dashboards (Strictly tied to shop slug) */}
      <Route path="/shop/:shopSlug/admin" element={<AdminPage />} />

      {/* 6. Partner Registration */}
      <Route path="/partner-register" element={<PartnerRegisterPage />} />

      {/* 7. Catch-all Fallback -> Redirects back to Business Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
