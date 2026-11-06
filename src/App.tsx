import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from '@/pages/AdminPage';
import KioskPage from '@/pages/KioskPage';
import OrderStatusPage from '@/pages/OrderStatusPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';
import { BusinessLandingPage } from '@/pages/BusinessLandingPage';
import SuperAdminPage from '@/pages/SuperAdminPage';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';

export default function App() {
  return (
    <Routes>
      {/* Default redirect to your main shop */}
      <Route path="/" element={<Navigate to={`/shop/${DEFAULT_SHOP_SLUG}`} replace />} />
      
      {/* Customer Kiosk */}
      <Route path="/shop/:shopSlug" element={<KioskPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />

      {/* Individual Shop Admin Panels */}
      <Route path="/shop/:shopSlug/admin" element={<AdminPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Master Control Panel (Protected) */}
      <Route path="/super-admin" element={<SuperAdminPage />} />

      {/* Public Pages */}
      <Route path="/for-business" element={<BusinessLandingPage />} />
      <Route path="/partner-register" element={<PartnerRegisterPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
