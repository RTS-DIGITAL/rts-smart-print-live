import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from '@/pages/AdminPage';
import KioskPage from '@/pages/KioskPage';
import OrderStatusPage from '@/pages/OrderStatusPage';
import PartnerRegisterPage from '@/pages/PartnerRegisterPage';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/shop/${DEFAULT_SHOP_SLUG}`} replace />} />
      <Route path="/shop/:shopSlug" element={<KioskPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/partner-register" element={<PartnerRegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
