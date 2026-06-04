'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { formatPrice, statusColors } from '@/lib/mockData';
import Link from 'next/link';
import { EyeIcon, XMarkIcon, CheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function ManagerOrdersPage() {
  const { currentUser } = useAuth();
  const [orderList, setOrderList] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('orders'); // orders | custom
  const [loading, setLoading] = useState(true);

  // Custom order modal
  const [selectedCO, setSelectedCO] = useState(null);
  const [dealAmount, setDealAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/custom-orders').then(r => r.json()),
    ]).then(([orders, customs]) => {
      if (Array.isArray(orders)) setOrderList(orders);
      if (Array.isArray(customs)) setCustomOrders(customs);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'developer')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Akses Ditolak</h1>
        <Link href="/" className="btn-primary">Kembali</Link>
      </div>
    );
  }

  const filtered = filterStatus === 'all' ? orderList : orderList.filter(o => o.status === filterStatus);
  const filteredCustom = filterStatus === 'all' ? customOrders : customOrders.filter(o => o.status === filterStatus);

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrderList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const updateCustomStatus = async (orderId, newStatus) => {
    setCustomOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await fetch('/api/custom-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update custom order status:', err);
    }
  };

  const handleSetDeal = async (orderId) => {
    if (!dealAmount || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/custom-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, total_amount: parseInt(dealAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCustomOrders(prev => prev.map(o => o.id === orderId ? {
        ...o, total_amount: parseInt(dealAmount), remaining_amount: data.remaining_amount, status: 'in_progress'
      } : o));
      setSelectedCO(null);
      setDealAmount('');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const customStatusColors = {
    ...statusColors,
    dp_paid: 'bg-blue-50 text-blue-600 border-blue-200',
    in_progress: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const orderStatuses = ['all', 'pending', 'paid', 'processing', 'completed', 'cancelled'];
  const customStatuses = ['all', 'pending', 'dp_paid', 'in_progress', 'completed', 'cancelled'];
  const currentStatuses = activeTab === 'orders' ? orderStatuses : customStatuses;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kelola Pesanan</h1>
        <p className="text-slate-500 mt-1">{orderList.length} pesanan reguler, {customOrders.length} custom order</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 w-fit" style={{ background: '#F1F3F9' }}>
        <button onClick={() => { setActiveTab('orders'); setFilterStatus('all'); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
          Pesanan Reguler ({orderList.length})
        </button>
        <button onClick={() => { setActiveTab('custom'); setFilterStatus('all'); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'custom' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
          Custom Order ({customOrders.length})
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {currentStatuses.map(status => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status ? 'text-white' : 'text-slate-500'}`}
            style={filterStatus === status
              ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }
              : { background: '#F1F3F9', border: '1px solid rgba(108, 60, 225, 0.1)' }}>
            {status === 'all' ? 'Semua' : status === 'dp_paid' ? 'DP Paid' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* ═══ Regular Orders Tab ═══ */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Tidak ada pesanan</div>
          ) : filtered.map(order => (
            <div key={order.id} className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">{order.id}</h3>
                    <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{order.user_name || 'Unknown'} • {order.created_at} • {order.payment_method || '-'}</p>
                </div>
                <p className="text-xl font-bold gradient-text">{formatPrice(order.total_price)}</p>
              </div>
              <div className="space-y-2 mb-4">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: '#F8F9FC' }}>
                    <div>
                      <span className="text-sm text-slate-600">{item.title}</span>
                      {item.selected_color && <span className="text-xs text-purple-500 ml-2">🎨 {item.selected_color}</span>}
                      {item.selected_size && <span className="text-xs text-slate-400 ml-1">({item.selected_size})</span>}
                    </div>
                    <span className="text-sm text-slate-500">{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.1)' }}>
                <span className="text-xs text-slate-400 self-center mr-2">Ubah status:</span>
                {['pending', 'paid', 'processing', 'completed', 'cancelled'].map(s => (
                  <button key={s} onClick={() => updateOrderStatus(order.id, s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${order.status === s ? 'opacity-50 cursor-default' : 'hover:opacity-80'} ${statusColors[s]}`}
                    disabled={order.status === s}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Custom Orders Tab ═══ */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {filteredCustom.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Tidak ada custom order</div>
          ) : filteredCustom.map(co => (
            <div key={co.id} className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-800 font-mono">{co.id}</h3>
                    <span className={`badge ${customStatusColors[co.status] || 'bg-slate-50 text-slate-600'}`}>{co.status === 'dp_paid' ? 'DP Paid' : co.status === 'in_progress' ? 'In Progress' : co.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{co.user_name || 'Unknown'} • {co.product_type} • {co.phone || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-semibold">DP: {formatPrice(co.dp_amount)}</p>
                  {co.total_amount > 0 && <p className="text-lg font-bold gradient-text">{formatPrice(co.total_amount)}</p>}
                </div>
              </div>

              {/* Description */}
              {co.description && (
                <div className="px-3 py-2 rounded-lg mb-4 text-sm text-slate-600" style={{ background: '#F8F9FC' }}>
                  📝 {co.description}
                </div>
              )}

              {/* Deal info */}
              {co.total_amount > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <span className="text-slate-500">Total Deal: <strong className="text-slate-800">{formatPrice(co.total_amount)}</strong></span>
                  <span className="text-slate-500">DP: <strong className="text-green-600">{formatPrice(co.dp_amount)}</strong></span>
                  <span className="text-slate-500">Sisa: <strong className="text-orange-600">{formatPrice(co.remaining_amount)}</strong></span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.1)' }}>
                {/* Set Deal button — only for dp_paid orders without total_amount */}
                {co.status === 'dp_paid' && (!co.total_amount || co.total_amount === 0) && (
                  <button onClick={() => { setSelectedCO(co); setDealAmount(''); }}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-all flex items-center gap-1">
                    <CurrencyDollarIcon className="w-3.5 h-3.5" /> Set Harga Final
                  </button>
                )}

                {/* Complete button — for in_progress orders */}
                {co.status === 'in_progress' && (
                  <button onClick={() => updateCustomStatus(co.id, 'completed')}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-all flex items-center gap-1">
                    <CheckIcon className="w-3.5 h-3.5" /> Tandai Selesai
                  </button>
                )}

                {/* Cancel — for pending/dp_paid */}
                {['pending', 'dp_paid'].includes(co.status) && (
                  <button onClick={() => updateCustomStatus(co.id, 'cancelled')}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all">
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Set Deal Modal ═══ */}
      {selectedCO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCO(null)}>
          <div className="glass-card p-6 max-w-md w-full space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Set Harga Final</h3>
              <button onClick={() => setSelectedCO(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span className="font-mono font-bold text-slate-800">{selectedCO.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="text-slate-800">{selectedCO.user_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Produk</span><span className="text-slate-800">{selectedCO.product_type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">DP Dibayar</span><span className="text-blue-600 font-bold">{formatPrice(selectedCO.dp_amount)}</span></div>
              {selectedCO.phone && <div className="flex justify-between"><span className="text-slate-500">Telepon</span><span className="text-slate-800">{selectedCO.phone}</span></div>}
            </div>

            {selectedCO.description && (
              <div className="p-3 rounded-xl text-sm text-slate-600" style={{ background: '#F8F9FC' }}>
                📝 {selectedCO.description}
              </div>
            )}

            <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.08)' }}>
              <p className="text-xs text-slate-400">Masukkan total harga final setelah deal di WhatsApp. Sisa = Total - DP ({formatPrice(selectedCO.dp_amount)})</p>
              <div className="flex gap-2">
                <input type="number" value={dealAmount} onChange={e => setDealAmount(e.target.value)}
                  placeholder="Total harga final" className="input-field flex-1 text-sm" min={selectedCO.dp_amount} />
                <button onClick={() => handleSetDeal(selectedCO.id)} className="btn-primary text-sm px-5" disabled={isUpdating || !dealAmount || parseInt(dealAmount) < selectedCO.dp_amount}>
                  {isUpdating ? '...' : 'Set'}
                </button>
              </div>
              {dealAmount && parseInt(dealAmount) >= selectedCO.dp_amount && (
                <div className="flex justify-between text-sm p-3 rounded-xl" style={{ background: 'rgba(108, 60, 225, 0.04)' }}>
                  <span className="text-slate-500">Sisa bayar user:</span>
                  <span className="font-bold text-purple-600">{formatPrice(parseInt(dealAmount) - selectedCO.dp_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
