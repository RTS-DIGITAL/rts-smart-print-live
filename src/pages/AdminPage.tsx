import { useCallback, useEffect, useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { ConnectorCard } from '@/components/admin/ConnectorCard';
import { CounterQrPanel } from '@/components/admin/CounterQrPanel';
import { OrdersPanel } from '@/components/admin/OrdersPanel';
import { OverviewPanel } from '@/components/admin/OverviewPanel';
import { PricingPanel } from '@/components/admin/PricingPanel';
import { PrintersPanel } from '@/components/admin/PrintersPanel';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';
import type { AdminUser, Shop } from '@/lib/types';
import { printService } from '@/services/printService';

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = printService.subscribeAuth((next) => {
      if (!active) return;
      setUser(next);
      setAuthReady(true);
    });
    printService
      .getUser()
      .then((next) => {
        if (!active) return;
        setUser(next);
        setAuthReady(true);
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  return <ShopGate user={user} />;
}

function ShopGate({ user }: { user: AdminUser }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unclaimed' | 'error'>('loading');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const fetchShop = useCallback(() => {
    printService
      .getOwnedShop()
      .then((found) => {
        setShop(found);
        setStatus(found ? 'ready' : 'unclaimed');
      })
      .catch((caught: unknown) => {
        setClaimError(getErrorMessage(caught));
        setStatus('error');
      });
  }, []);

  const loadShop = useCallback(() => {
    setStatus('loading');
    fetchShop();
  }, [fetchShop]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  async function claim() {
    setClaiming(true);
    setClaimError(null);
    try {
      const claimed = await printService.claimShop(DEFAULT_SHOP_SLUG);
      if (claimed) loadShop();
      else setClaimError('This shop already has an owner. Ask the owner to add you.');
    } catch (caught) {
      setClaimError(getErrorMessage(caught));
    } finally {
      setClaiming(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading shop" />
      </div>
    );
  }

  if (status === 'unclaimed' || status === 'error' || !shop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-slate-900">
            {status === 'error' ? 'We could not load your shop' : 'Your shop is not connected yet'}
          </p>
          <p className="text-sm text-slate-500">
            {claimError ?? 'Connect this admin account to RTS Digital Seva to manage its orders.'}
          </p>
          {status === 'unclaimed' && (
            <button
              type="button"
              onClick={claim}
              disabled={claiming}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
            >
              {claiming && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Connect shop
            </button>
          )}
          <button
            type="button"
            onClick={() => void printService.signOut()}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard shop={shop} user={user} onShopChanged={fetchShop} />;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'printers', label: 'Printers' },
  { id: 'counter', label: 'Counter QR' },
  { id: 'settings', label: 'Settings' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function AdminDashboard({
  shop,
  user,
  onShopChanged,
}: {
  shop: Shop;
  user: AdminUser;
  onShopChanged: () => void;
}) {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold leading-tight">{shop.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void printService.signOut()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-3 md:px-6" aria-label="Admin sections">
          <ul className="flex gap-1">
            {TABS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? 'page' : undefined}
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
                    tab === item.id
                      ? 'border-emerald-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {printService.mode === 'demo' && (
        <div className="bg-amber-50 px-5 py-2 text-center text-xs font-medium text-amber-800">
          Demo data: changes are not saved after the page reloads.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        {tab === 'overview' && <OverviewPanel shop={shop} />}
        {tab === 'orders' && <OrdersPanel shopId={shop.id} />}
        {tab === 'pricing' && <PricingPanel shopId={shop.id} />}
        {tab === 'printers' && <PrintersPanel shop={shop} onSaved={onShopChanged} />}
        {tab === 'counter' && <CounterQrPanel shop={shop} />}
        {tab === 'settings' && (
          <div className="space-y-6">
            <SettingsPanel shop={shop} onSaved={onShopChanged} />
            <ConnectorCard shopId={shop.id} />
          </div>
        )}
      </main>
    </div>
  );
}
