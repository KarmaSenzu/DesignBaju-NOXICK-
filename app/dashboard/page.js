'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useAuth } from '@/lib/auth';
import { useWishlist } from '@/lib/wishlist';
import { useCart } from '@/lib/cart';
import { formatPrice, statusColors } from '@/lib/mockData';
import Link from 'next/link';
import { ShoppingBagIcon, ClockIcon, ArrowDownTrayIcon, PaintBrushIcon, ArrowRightIcon, HeartIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();
  const [activeTab, setActiveTab] = useState('overview');
  const [dbOrders, setDbOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [payingRemaining, setPayingRemaining] = useState(null);

  // Fetch orders, purchases, and custom orders
  useEffect(() => {
    if (!currentUser) return;
    const orderUrl = currentUser.role === 'user'
      ? `/api/orders?user_id=${currentUser.id}`
      : '/api/orders';

    fetch(orderUrl)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDbOrders(data);
      })
      .catch(() => {});

    if (currentUser.role === 'user') {
      fetch(`/api/purchases?user_id=${currentUser.id}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setPurchases(data);
        })
        .catch(() => {});
    }

    // Fetch custom orders
    const customUrl = currentUser.role === 'user'
      ? `/api/custom-orders?user_id=${currentUser.id}`
      : '/api/custom-orders';

    fetch(customUrl)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCustomOrders(data);
      })
      .catch(() => {});
  }, [currentUser]);

  const handleDownload = async (purchase_id) => {
    try {
      setDownloadingId(purchase_id);
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memulai download');

      window.location.href = `/api/download?token=${data.token}`;
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePayRemaining = async (customOrder) => {
    setPayingRemaining(customOrder.id);
    const paymentOrderId = `CUSTFULL-${customOrder.id}`;

    // Try Midtrans
    if (typeof window !== 'undefined' && window.snap) {
      try {
        const tokenRes = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: paymentOrderId,
            gross_amount: customOrder.remaining_amount,
            items: [{ id: customOrder.id, title: `Pelunasan Custom Order - ${customOrder.product_type}`, price: customOrder.remaining_amount, quantity: 1 }],
            customer: { name: currentUser?.name, email: currentUser?.email },
          }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.success && tokenData.token) {
          window.snap.pay(tokenData.token, {
            onSuccess: async () => {
              await fetch('/api/custom-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: customOrder.id, status: 'completed', midtrans_full_id: paymentOrderId }),
              });
              setCustomOrders(prev => prev.map(co => co.id === customOrder.id ? { ...co, status: 'completed', remaining_amount: 0 } : co));
              setPayingRemaining(null);
            },
            onError: () => {
              alert('Pembayaran gagal.');
              setPayingRemaining(null);
            },
            onClose: () => setPayingRemaining(null),
          });
          return;
        }
      } catch (err) {
        console.warn('Midtrans not available:', err);
      }
    }

    // Fallback
    try {
      await fetch('/api/custom-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customOrder.id, status: 'completed' }),
      });
      setCustomOrders(prev => prev.map(co => co.id === customOrder.id ? { ...co, status: 'completed', remaining_amount: 0 } : co));
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setPayingRemaining(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Login Diperlukan</h1>
        <p className="text-slate-500 mb-6">Anda harus login untuk mengakses dashboard</p>
        <Link href="/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  const userOrders = dbOrders;
  const completedOrders = userOrders.filter(o => o.status === 'completed');

  const customStatusColors = {
    ...statusColors,
    dp_paid: 'bg-blue-50 text-blue-600 border-blue-200',
    accepted: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    in_progress: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'wishlist', label: `Wishlist (${wishlistItems.length})` },
    { id: 'orders', label: 'Pesanan' },
    { id: 'custom', label: `Custom (${customOrders.length})` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Midtrans Script */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        strategy="lazyOnload"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Selamat datang, {currentUser.name}!</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit overflow-x-auto" style={{ background: 'rgba(241, 243, 249, 0.8)', border: '1px solid rgba(108, 60, 225, 0.06)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-800'
              }`}
            style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Pesanan', value: userOrders.length, icon: <ShoppingBagIcon className="w-6 h-6" />, color: '#6C3CE1' },
              { label: 'Menunggu', value: userOrders.filter(o => o.status === 'pending' || o.status === 'processing').length, icon: <ClockIcon className="w-6 h-6" />, color: '#F59E0B' },
              { label: 'Selesai', value: completedOrders.length, icon: <ArrowDownTrayIcon className="w-6 h-6" />, color: '#10B981' },
              { label: 'Custom Order', value: customOrders.length, icon: <PaintBrushIcon className="w-6 h-6" />, color: '#FF6B6B' },
            ].map(stat => (
              <div key={stat.label} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}10`, color: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Pesanan Terbaru</h2>
              </div>
              <div className="space-y-3">
                {userOrders.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">Belum ada pesanan</p>
                ) : (
                  userOrders.slice(0, 4).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8F9FC' }}>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{order.id}</p>
                        <p className="text-xs text-slate-400">{order.items.length} item • {order.created_at}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold gradient-text">{formatPrice(order.total_price)}</p>
                        <span className={`badge text-xs mt-1 ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Downloads */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                 <h2 className="text-lg font-bold text-slate-800">File Tersedia</h2>
                 <span className="text-xs text-slate-500">{purchases.length} File</span>
              </div>
              <div className="space-y-3">
                {purchases.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">Belum ada file untuk didownload</p>
                ) : (
                  purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-purple-100 transition-all" style={{ background: '#F8F9FC' }}>
                      {purchase.preview_image && <img src={purchase.preview_image} alt={purchase.title} className="w-12 h-12 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{purchase.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-400">{purchase.file_formats.join(', ')}</p>
                            {purchase.is_tampered ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">⚠️ Tampered</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-medium">✓ Verified</span>
                            )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(purchase.id)}
                        disabled={downloadingId === purchase.id || purchase.is_tampered || !purchase.design_file}
                        className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                      >
                        {downloadingId === purchase.id ? (
                          <svg className="animate-spin w-4 h-4 mx-auto" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                          <><ArrowDownTrayIcon className="w-4 h-4" /> Download</>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistItems.length === 0 ? (
            <div className="text-center py-20">
              <HeartIcon className="w-20 h-20 mx-auto text-slate-300 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Wishlist Kosong</h2>
              <p className="text-slate-500 mb-6">Belum ada desain yang disimpan di wishlist Anda</p>
              <Link href="/catalog" className="btn-primary">Jelajahi Katalog</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {wishlistItems.map(item => (
                <div key={item.id} className="glass-card overflow-hidden group">
                  <Link href={`/design/${item.id}`}>
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={item.preview_image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/design/${item.id}`}>
                      <h3 className="text-base font-semibold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors truncate">{item.title}</h3>
                    </Link>
                    <p className="text-xs text-slate-400 mb-3">{item.category}</p>
                    <p className="text-lg font-bold gradient-text mb-3">{formatPrice(item.price)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!isInCart(item.id)) addToCart(item);
                        }}
                        className={`flex-1 text-xs py-2 rounded-xl font-medium transition-all ${isInCart(item.id)
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'btn-primary'
                          }`}
                      >
                        {isInCart(item.id) ? '✓ Di Keranjang' : 'Tambah ke Keranjang'}
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {userOrders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBagIcon className="w-20 h-20 mx-auto text-slate-300 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Belum Ada Pesanan</h2>
              <p className="text-slate-500 mb-6">Anda belum melakukan pembelian</p>
              <Link href="/catalog" className="btn-primary">Mulai Belanja</Link>
            </div>
          ) : (
            userOrders.map(order => (
              <div key={order.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{order.id}</h3>
                    <p className="text-xs text-slate-400">{order.created_at} • {order.payment_method || 'Belum bayar'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
                    <p className="text-lg font-bold gradient-text mt-1">{formatPrice(order.total_price)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, i) => {
                    const previewImg = item.preview_image;
                    const formats = item.file_formats || [];
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8F9FC' }}>
                        {previewImg && <img src={previewImg} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs text-slate-400">{formats.join(', ')}</p>
                          {item.selected_color && <p className="text-[10px] text-purple-500">🎨 {item.selected_color}</p>}
                          {item.notes && <p className="text-[10px] text-slate-400">📝 {item.notes}</p>}
                        </div>
                        <p className="text-sm font-bold text-purple-600">{formatPrice(item.price)}</p>
                        {order.status === 'completed' && (() => {
                          const pId = purchases.find(p => p.order_id === order.id && String(p.design_id) === String(item.design_id))?.id;
                          return pId ? (
                             <button onClick={() => handleDownload(pId)}
                               disabled={downloadingId === pId}
                               className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                               {downloadingId === pId ? '...' : <ArrowDownTrayIcon className="w-4 h-4" />}
                             </button>
                          ) : null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom Orders Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">Custom Order Saya</h2>
            <Link href="/custom-order" className="btn-primary text-sm">
              <PaintBrushIcon className="w-4 h-4" /> Buat Baru
            </Link>
          </div>

          {customOrders.length === 0 ? (
            <div className="text-center py-16">
              <PaintBrushIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Custom Order</h3>
              <p className="text-slate-500 mb-6">Buat pesanan kustom untuk mendapatkan desain impian Anda</p>
              <Link href="/custom-order" className="btn-primary">Buat Custom Order</Link>
            </div>
          ) : (
            customOrders.map(co => (
              <div key={co.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-mono">{co.id}</h3>
                    <p className="text-xs text-slate-400">{co.product_type} • {co.deadline ? new Date(co.deadline).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                  <span className={`badge ${customStatusColors[co.status] || 'bg-slate-50 text-slate-600'}`}>{co.status}</span>
                </div>

                {co.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{co.description}</p>
                )}

                {/* Payment Progress */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl text-center" style={{ background: '#F8F9FC' }}>
                    <p className="text-[10px] text-slate-400">Budget</p>
                    <p className="text-sm font-bold text-slate-800">{formatPrice(co.budget)}</p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                    <p className="text-[10px] text-slate-400">DP Dibayar</p>
                    <p className="text-sm font-bold text-blue-600">{formatPrice(co.dp_amount)}</p>
                  </div>
                  {co.total_amount > 0 && (
                    <>
                      <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                        <p className="text-[10px] text-slate-400">Total Deal</p>
                        <p className="text-sm font-bold text-green-600">{formatPrice(co.total_amount)}</p>
                      </div>
                      <div className="p-3 rounded-xl text-center" style={{ background: co.remaining_amount > 0 ? 'rgba(249, 115, 22, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
                        <p className="text-[10px] text-slate-400">Sisa</p>
                        <p className={`text-sm font-bold ${co.remaining_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {co.remaining_amount > 0 ? formatPrice(co.remaining_amount) : '✓ Lunas'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Status Progress Bar */}
                <div className="flex items-center gap-1 mb-4">
                  {['pending', 'dp_paid', 'in_progress', 'completed'].map((s, i) => (
                    <div key={s} className="flex-1">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          background: ['pending', 'dp_paid', 'in_progress', 'completed'].indexOf(co.status) >= i
                            ? 'linear-gradient(135deg, #6C3CE1, #8B5CF6)'
                            : '#E2E8F0'
                        }}
                      />
                      <p className="text-[9px] text-slate-400 mt-1 text-center">{s.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>

                {/* Pay Remaining Button */}
                {co.status === 'in_progress' && co.remaining_amount > 0 && (
                  <button
                    onClick={() => handlePayRemaining(co)}
                    disabled={payingRemaining === co.id}
                    className="btn-accent w-full py-3 text-sm disabled:opacity-50"
                  >
                    {payingRemaining === co.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        Memproses...
                      </span>
                    ) : (
                      <>
                        <CreditCardIcon className="w-4 h-4 inline mr-1" />
                        Bayar Sisa {formatPrice(co.remaining_amount)}
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
