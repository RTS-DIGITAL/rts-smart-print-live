import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  Clock, 
  Printer, 
  AlertCircle, 
  ArrowLeft,
  FileText
} from 'lucide-react';

interface OrderDetail {
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
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      // Allow searching by either the UUID `id` OR the display `order_number`
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      
      let query = supabase
        .from('print_orders')
        .select('*, shops(name, slug, phone, counter_notice)');

      if (isUuid) {
        query = query.eq('id', orderId);
      } else {
        query = query.eq('order_number', orderId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (data) setOrder(data as OrderDetail);
    } catch (err) {
      console.error('Failed to load order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Subscribe to live order status updates
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'print_orders' },
        (payload) => {
          if (payload.new && (payload.new.id === orderId || payload.new.order_number === orderId)) {
            setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-xs font-bold text-slate-400 animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">
            We could not find order reference: <code className="font-mono text-emerald-700">{orderId}</code>
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const shopSlug = order.shops?.slug || 'rts-digital-seva';
  const shopName = order.shops?.name || 'Smart Print Station';
  const shopPhone = order.shops?.phone || '7012833699';
  const counterNotice = order.shops?.counter_notice || 'Please collect prints at Counter 1';

  const isCompleted = order.status === 'completed';
  const isPrinting = order.status === 'printing';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-40 flex justify-between items-center shadow-md">
        <div>
          <h1 className="font-extrabold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {shopName}
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">Order: {order.order_number}</p>
        </div>
        <Link
          to={`/shop/${shopSlug}`}
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
            isCompleted 
              ? 'bg-emerald-100 text-emerald-600' 
              : isPrinting 
              ? 'bg-blue-100 text-blue-600 animate-pulse' 
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Printer className="w-7 h-7" />}
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Live Order Status
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              {isCompleted ? 'Ready for Pickup' : isPrinting ? 'Printing Document...' : 'Queued for Printing'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isCompleted 
                ? 'Your document has finished printing at the counter!' 
                : isPrinting 
                ? 'Pages are actively spooling from the counter printer.' 
                : 'Payment received. Waiting its turn in the counter queue.'}
            </p>
          </div>

          {/* Collection Notice Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left text-xs space-y-1.5 text-emerald-900">
            <p className="font-bold">{counterNotice}</p>
            <p className="text-[11px] text-emerald-700">
              Shop Contact: <strong>{shopPhone}</strong>
            </p>
          </div>

          {/* Stepper Display */}
          <div className="space-y-2 pt-2 text-left text-xs">
            <div className="flex items-center gap-2.5 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Queued & Paid</span>
            </div>
            <div className={`flex items-center gap-2.5 font-bold ${
              isPrinting || isCompleted ? 'text-emerald-700' : 'text-slate-400'
            }`}>
              <CheckCircle2 className={`w-4 h-4 ${isPrinting || isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Printing to Machine</span>
            </div>
            <div className={`flex items-center gap-2.5 font-bold ${
              isCompleted ? 'text-emerald-700' : 'text-slate-400'
            }`}>
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Ready for Counter Collection</span>
            </div>
          </div>
        </div>

        {/* Receipt Details Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Order Number</span>
            <span className="font-mono font-bold text-slate-900">{order.order_number}</span>
          </div>

          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">File Name</span>
            <span className="font-medium text-slate-800 truncate max-w-[200px]">{order.file_name}</span>
          </div>

          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Setup</span>
            <span className="font-medium text-slate-800">
              {order.paper_size || 'A4'}, {order.is_color ? 'Color' : 'B&W'}, {order.is_double_sided ? '2-Sided' : '1-Sided'}
            </span>
          </div>

          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Pages × Copies</span>
            <span className="font-medium text-slate-800">{order.page_count || 1} × {order.copies}</span>
          </div>

          <div className="flex justify-between pt-1 text-sm font-extrabold">
            <span className="text-slate-900">Total Paid</span>
            <span className="text-emerald-600">₹{order.total_amount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Back to Raju Shop button */}
        <div className="text-center pt-2">
          <Link
            to={`/shop/${shopSlug}`}
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
