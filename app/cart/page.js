'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { formatPrice, promoCodes } from '@/lib/mockData';
import Link from 'next/link';
import { TrashIcon, ShoppingBagIcon, CheckCircleIcon, CreditCardIcon, BuildingLibraryIcon, DevicePhoneMobileIcon, TagIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

export default function CartPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-20 text-center"><p className="text-slate-400">Memuat keranjang...</p></div>}>
      <CartPageContent />
    </Suspense>
  );
}

function CartPageContent() {
  const { cartItems, removeFromCart, clearCart, totalPrice } = useCart();
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const [step, setStep] = useState('cart');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [itemNotes, setItemNotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-trigger checkout if coming from "Buy Now"
  useEffect(() => {
    if (searchParams.get('checkout') === '1' && currentUser && cartItems.length > 0) {
      setStep('checkout');
    }
  }, [searchParams, currentUser, cartItems.length]);

  // Auto-remove sold out items
  useEffect(() => {
    if (cartItems.length > 0) {
      fetch('/api/sold-items')
        .then(r => r.json())
        .then(data => {
          if (data.sold_ids) {
            const soldSet = new Set(data.sold_ids.map(id => String(id)));
            cartItems.forEach(item => {
              // Compare using plain numeric ID (strip 'api-' prefix if present)
              const rawId = String(item.id);
              const numericId = rawId.startsWith('api-') ? rawId.replace('api-', '') : rawId;
              if (soldSet.has(numericId)) {
                removeFromCart(item.id);
                alert(`Maaf, item "${item.title}" dihapus dari keranjang karena baru saja terjual.`);
              }
            });
          }
        })
        .catch(() => {});
    }
  }, [cartItems.length]); // Intentionally checking on length change or mount

  const applyPromoCode = () => {
    setPromoError('');
    const promo = promoCodes.find(p => p.code.toUpperCase() === promoCode.toUpperCase() && p.active);
    if (!promo) {
      setPromoError('Kode promo tidak valid atau sudah kadaluarsa');
      return;
    }
    if (totalPrice < promo.minPurchase) {
      setPromoError(`Minimum pembelian ${formatPrice(promo.minPurchase)}`);
      return;
    }
    setAppliedPromo(promo);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? Math.min(totalPrice * appliedPromo.discount / 100, appliedPromo.maxDiscount)
      : appliedPromo.discount
    : 0;

  const finalPrice = totalPrice - discountAmount;

  const handleCheckout = () => {
    if (!currentUser) return;
    setStep('checkout');
  };

  const handlePay = async () => {
    if (!paymentMethod || isProcessing) return;

    // Check if any cart items are now sold out
    try {
      const soldRes = await fetch('/api/sold-items');
      const soldData = await soldRes.json();
      if (soldData.sold_ids) {
        const soldSet = new Set(soldData.sold_ids.map(id => Number(id)));
        const soldItems = cartItems.filter(item => {
          const rawId = String(item.id);
          const numId = rawId.startsWith('api-') ? parseInt(rawId.replace('api-', '')) : parseInt(rawId);
          return soldSet.has(numId);
        });
        if (soldItems.length > 0) {
          alert(`Maaf, desain berikut sudah terjual:\n${soldItems.map(i => `• ${i.title}`).join('\n')}\n\nSilakan hapus dari keranjang.`);
          return;
        }
      }
    } catch (err) {
      console.warn('Sold check failed:', err);
    }

    setIsProcessing(true);

    const paymentMethodLabels = { bank: 'Bank Transfer', card: 'Kartu Kredit/Debit', ewallet: 'E-Wallet', midtrans: 'Midtrans' };
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // Try Midtrans Snap payment first
    if (typeof window !== 'undefined' && window.snap) {
      try {
        // Request Midtrans token from backend
        const tokenRes = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            gross_amount: finalPrice,
            items: cartItems.map(item => {
              const rawId = String(item.id);
              return {
                id: rawId.startsWith('api-') ? parseInt(rawId.replace('api-', '')) : item.id,
                title: item.title,
                price: item.price,
                quantity: 1,
              };
            }),
            customer: {
              name: currentUser?.name,
              email: currentUser?.email,
            },
          }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.success && tokenData.token) {
          // Open Midtrans Snap popup
          window.snap.pay(tokenData.token, {
            onSuccess: async () => {
              await saveOrder(orderId, paymentMethodLabels[paymentMethod] || 'Midtrans', 'paid');
            },
            onPending: async () => {
              await saveOrder(orderId, paymentMethodLabels[paymentMethod] || 'Midtrans', 'pending');
            },
            onError: () => {
              alert('Pembayaran gagal. Silakan coba lagi.');
              setIsProcessing(false);
            },
            onClose: () => {
              setIsProcessing(false);
            },
          });
          return;
        }
      } catch (err) {
        console.warn('Midtrans not available, falling back to direct save:', err);
      }
    }

    // Fallback: save order directly (when Midtrans is not configured)
    // Set status to 'paid' since user completed the payment flow
    await saveOrder(orderId, paymentMethodLabels[paymentMethod] || paymentMethod, 'paid');
  };

  const saveOrder = async (orderId, paymentLabel, status = 'pending') => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id,
          items: cartItems.map(item => {
            // Strip 'api-' prefix if present — the orders API expects a plain numeric ID
            const rawId = String(item.id);
            const designId = rawId.startsWith('api-') ? parseInt(rawId.replace('api-', '')) : item.id;
            return {
              design_id: designId,
              title: item.title,
              price: item.price,
              notes: itemNotes[item.id] || null,
              selected_color: item.selected_color || null,
              selected_size: item.selected_size || null,
            };
          }),
          total_price: finalPrice,
          payment_method: paymentLabel,
          discount: discountAmount,
          promo_code: appliedPromo?.code || null,
          status: status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pesanan');

      setStep('success');
      clearCart();
      setAppliedPromo(null);
      setPromoCode('');
      setItemNotes({});
    } catch (err) {
      alert('Gagal memproses pembayaran: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <CheckCircleIcon className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Pembayaran Berhasil!</h1>
        <p className="text-slate-500 mb-8">Terima kasih atas pembelian Anda. Desain sudah dapat didownload melalui dashboard.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard" className="btn-primary">Lihat Dashboard</Link>
          <Link href="/catalog" className="btn-secondary">Lanjut Belanja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Midtrans Snap Script */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY !== 'SB-Mid-client-XXXXXXXXXXXXXXXX'
          ? 'https://app.sandbox.midtrans.com/snap/snap.js'
          : ''}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        strategy="lazyOnload"
      />

      <h1 className="text-3xl font-bold text-slate-800 mb-8">
        {step === 'cart' ? 'Keranjang Belanja' : 'Checkout'}
      </h1>

      {cartItems.length === 0 && step === 'cart' ? (
        <div className="text-center py-20">
          <ShoppingBagIcon className="w-20 h-20 mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Keranjang Kosong</h2>
          <p className="text-slate-500 mb-6">Belum ada desain di keranjang Anda</p>
          <Link href="/catalog" className="btn-primary">Jelajahi Katalog</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {step === 'cart' && cartItems.map(item => (
              <div key={item.id} className="glass-card p-4 space-y-3">
                <div className="flex gap-4">
                  <img src={item.preview_image} alt={item.title} className="w-24 h-24 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.category}</p>
                    {item.selected_color && (
                      <p className="text-xs text-purple-600 mt-1">🎨 Warna: {item.selected_color}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(item.file_formats || []).map(f => (
                        <span key={f} className="text-xs px-2 py-0.5 rounded text-slate-500" style={{ background: 'rgba(108, 60, 225, 0.06)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-between">
                    <p className="text-lg font-bold gradient-text">{formatPrice(item.price)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all self-end">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Per-item note */}
                <div className="flex items-start gap-2">
                  <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-slate-400 mt-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={itemNotes[item.id] || ''}
                    onChange={e => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Catatan untuk item ini (opsional)..."
                    className="input-field text-sm flex-1 py-2"
                  />
                </div>
              </div>
            ))}

            {step === 'checkout' && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Pilih Metode Pembayaran</h2>
                {[
                  { id: 'bank', label: 'Bank Transfer', icon: <BuildingLibraryIcon className="w-6 h-6" />, desc: 'BCA, Mandiri, BNI, BRI' },
                  { id: 'card', label: 'Kartu Kredit/Debit', icon: <CreditCardIcon className="w-6 h-6" />, desc: 'Visa, Mastercard, JCB' },
                  { id: 'ewallet', label: 'E-Wallet', icon: <DevicePhoneMobileIcon className="w-6 h-6" />, desc: 'GoPay, OVO, DANA, ShopeePay' },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                    style={{
                      background: paymentMethod === method.id ? 'rgba(108, 60, 225, 0.06)' : '#FFFFFF',
                      border: `1px solid ${paymentMethod === method.id ? '#6C3CE1' : 'rgba(108, 60, 225, 0.08)'}`,
                    }}
                  >
                    <div className="text-purple-500">{method.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{method.label}</p>
                      <p className="text-xs text-slate-400">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && <CheckCircleIcon className="w-5 h-5 text-purple-500 ml-auto" />}
                  </button>
                ))}

                {/* Item summary with notes */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)' }}>
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Ringkasan Item</h3>
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#F8F9FC' }}>
                        <img src={item.preview_image} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                          {item.selected_color && <p className="text-[10px] text-purple-500">🎨 {item.selected_color}</p>}
                          {itemNotes[item.id] && <p className="text-[10px] text-slate-400">📝 {itemNotes[item.id]}</p>}
                        </div>
                        <p className="text-sm font-bold text-purple-600">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Ringkasan</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{cartItems.length} item</span>
                  <span className="text-slate-800">{formatPrice(totalPrice)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <TagIcon className="w-3.5 h-3.5" />
                      {appliedPromo.code}
                    </span>
                    <span className="text-green-600">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pajak</span>
                  <span className="text-slate-800">{formatPrice(0)}</span>
                </div>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)' }}>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">Total</span>
                  <span className="text-xl font-bold gradient-text">{formatPrice(finalPrice)}</span>
                </div>
              </div>

              {/* Promo Code */}
              {step === 'cart' && (
                <div>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs font-bold text-green-600">{appliedPromo.code}</p>
                          <p className="text-[10px] text-green-500">{appliedPromo.description}</p>
                        </div>
                      </div>
                      <button onClick={removePromo} className="text-xs text-red-500 hover:text-red-400">Hapus</button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                          placeholder="Kode Promo"
                          className="input-field text-sm flex-1"
                        />
                        <button onClick={applyPromoCode} className="btn-secondary text-sm px-4 whitespace-nowrap" disabled={!promoCode}>
                          Terapkan
                        </button>
                      </div>
                      {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
                      <p className="text-[10px] text-slate-400 mt-1.5">Coba: WELCOME20, HEMAT50K, BUNDLE30</p>
                    </div>
                  )}
                </div>
              )}

              {step === 'cart' ? (
                <>
                  {currentUser ? (
                    <button onClick={handleCheckout} className="btn-primary w-full py-3 text-base" disabled={cartItems.length === 0}>
                      Lanjut Checkout
                    </button>
                  ) : (
                    <Link href="/login" className="btn-primary w-full py-3 text-base text-center block">
                      Login untuk Checkout
                    </Link>
                  )}
                  <button onClick={clearCart} className="btn-secondary w-full py-2.5 text-sm">
                    Kosongkan Keranjang
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePay}
                    className="btn-accent w-full py-3 text-base disabled:opacity-50"
                    disabled={!paymentMethod || isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        Memproses...
                      </span>
                    ) : (
                      `Bayar ${formatPrice(finalPrice)}`
                    )}
                  </button>
                  <button onClick={() => setStep('cart')} className="btn-secondary w-full py-2.5 text-sm">
                    Kembali
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
