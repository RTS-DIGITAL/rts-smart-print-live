const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayInstance {
  open: () => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

interface CheckoutOptions {
  keyId: string;
  shopName: string;
  amountRupees: number;
  description: string;
  contact?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss: () => void;
}

let scriptLoader: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptLoader) {
    scriptLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoader = null;
        reject(new Error('Could not load the payment window. Please try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptLoader;
}

export async function openRazorpayCheckout(options: CheckoutOptions): Promise<void> {
  await loadCheckoutScript();
  const Checkout = window.Razorpay;
  if (!Checkout) throw new Error('Could not load the payment window. Please try again.');
  new Checkout({
    key: options.keyId,
    amount: Math.round(options.amountRupees * 100),
    currency: 'INR',
    name: options.shopName,
    description: options.description,
    prefill: { contact: options.contact },
    theme: { color: '#10B981' },
    handler: (response: { razorpay_payment_id: string }) => options.onSuccess(response.razorpay_payment_id),
    modal: { ondismiss: options.onDismiss },
  }).open();
}
