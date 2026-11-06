import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  Printer, 
  AlertCircle, 
  ArrowLeft,
  FileText
} from 'lucide-react';

interface OrderItem {
  id: string;
  order_number: string;
  file_name: string;
  page_count: number;
  copies: number;
  total_amount: number;
  status: string;
  is_color: boolean;
  is_double_sided: boolean;
  paper_size: string;
  created_at: string;
  shop_id: string;
  shops?: {
    name: string;
    slug: string;
    phone: string | null;
    counter_notice: string | null;
  };
}

export default function OrderStatusPage() {
  const { shopSlug: paramShopSlug, orderId } = useParams<{ shopSlug?: string; orderId: string }>();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      
      let query = supabase
        .from('print_orders')
        .select('*, shops(name, slug, phone, counter_notice)')
        .order('created_at', { ascending: true });

      if (isUuid) {
        query = query.eq('id', orderId);
      } else {
        query = query.eq('order_number', orderId);
      }

      // Use .select() without .maybeSingle() so multiple files in one batch load properly
      const { data, error } = await query;

      if (error) throw error;
      if (data && data.length > 0) {
        setOrderItems(data as OrderItem[]);
      }
    } catch (err) {
      console.error('Failed to load order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'print_orders' },
        (payload) => {
          if (payload.new && (payload.new.id === orderId || payload.new.order_number === orderId)) {
            setOrderItems((prev) =>
              prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const primaryItem = orderItems[0];
  const activeShopSlug = paramShopSlug || primaryItem?.shops?.slug || (window.location.pathname.includes('/raju-shop') ? 'raju-shop' : 'rts-digital-seva');
  const shopName = primaryItem?.shops?.name || (activeShopSlug === 'raju-shop' ? 'RAJU SHOP' : 'Smart Print Station');
  const shopPhone = primaryItem?.shops?.phone || '7025916338';
  const counterNotice = primaryItem?.shops?.counter_notice || 'Please collect prints at Counter 1';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-xs font-bold text-slate-400 animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">
            We could not find order reference: <code className="font-mono text-emerald-700">{orderId}</code>
          </p>
          <Link
            to={`/shop/${activeShopSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {shopName}
          </Link>
        </div>
      </div>
    );
  }

  const allCompleted = orderItems.every((item) => item.status === 'completed');
  const anyPrinting = orderItems.some((item) => item.status === 'printing');
  const grandTotal = orderItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const totalPages = orderItems.reduce((sum, item) => sum + ((item.page_count || 1) * (item.copies || 1)), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-40 flex justify-between items-center shadow-md">
        <div>
          <h1 className="font-extrabold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {shopName}
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">Order: {primaryItem.order_number}</p>
        </div>
        <Link
          to={`/shop/${activeShopSlug}`}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New Print</span>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 pt-8 space-y-5">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition ${
            allCompleted 
              ? 'bg-emerald-100 text-emerald-600' 
              : anyPrinting 
              ? 'bg-blue-100 text-blue-600 animate-pulse' 
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            {allCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Printer className="w-7 h-7" />}
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Live Order Status
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              {allCompleted ? 'Ready for Pickup' : anyPrinting ? 'Printing Documents...' : 'Queued for Printing'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {allCompleted 
                ? 'All documents have finished printing at the counter!' 
                : anyPrinting 
                ? 'Your batch is actively spooling from the counter printer.' 
                : 'Job registered. Waiting its turn in the counter queue.'}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left text-xs space-y-1.5 text-emerald-900">
            <p className="font-bold">{counterNotice}</p>
            <p className="text-[11px] text-emerald-700">
              Shop Contact: <strong>{shopPhone}</strong>
            </p>
          </div>
        </div>

        {/* Multi-Item Breakdown */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800">Files in this Order ({orderItems.length})</span>
            <span className="font-mono font-bold text-slate-900">{primaryItem.order_number}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {orderItems.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center gap-2">
                <div className="truncate">
                  <p className="font-bold text-slate-900 truncate max-w-[210px]">{item.file_name}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.page_count || 1} pgs × {item.copies} {item.copies === 1 ? 'copy' : 'copies'} • {item.is_color ? 'Color' : 'B&W'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">₹{item.total_amount?.toFixed(2)}</span>
                  <span className={`block text-[9px] font-extrabold uppercase ${
                    item.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-black">
            <span className="text-slate-900">Total Bill ({totalPages} pages)</span>
            <span className="text-emerald-600">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <Link
            to={`/shop/${activeShopSlug}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Print Another Document at {shopName}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
