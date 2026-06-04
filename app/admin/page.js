'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { formatPrice, statusColors } from '@/lib/mockData';
import Link from 'next/link';
import { UsersIcon, CubeIcon, ShoppingBagIcon, CurrencyDollarIcon, ServerIcon, ShieldCheckIcon, ArrowUpIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [dbUsers, setDbUsers] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [dbDesigns, setDbDesigns] = useState([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbUsers(d); }).catch(() => {});
    fetch('/api/orders').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbOrders(d); }).catch(() => {});
    fetch('/api/designs').then(r => r.json()).then(d => { if (Array.isArray(d)) setDbDesigns(d); }).catch(() => {});
  }, []);

  if (!currentUser || currentUser.role !== 'developer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Akses Ditolak</h1>
        <p className="text-slate-500 mb-6">Hanya Developer yang bisa mengakses halaman ini</p>
        <Link href="/" className="btn-primary">Kembali</Link>
      </div>
    );
  }

  const orders = dbOrders;
  const designs = dbDesigns;
  const users = dbUsers;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">System monitoring & management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length, icon: <UsersIcon className="w-6 h-6" />, color: '#6C3CE1' },
          { label: 'Total Desain', value: designs.length, icon: <CubeIcon className="w-6 h-6" />, color: '#FF6B6B' },
          { label: 'Total Orders', value: orders.length, icon: <ShoppingBagIcon className="w-6 h-6" />, color: '#F59E0B' },
          { label: 'Revenue', value: formatPrice(totalRevenue), icon: <CurrencyDollarIcon className="w-6 h-6" />, color: '#10B981' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium flex items-center gap-0.5 text-green-400">
                <ArrowUpIcon className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* System Health */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-purple-500" /> System Health
          </h2>
          <div className="space-y-4">
            {[
              { label: 'API Server', status: 'online', uptime: '99.9%' },
              { label: 'Database', status: 'online', uptime: '99.8%' },
              { label: 'Storage (S3)', status: 'online', uptime: '100%' },
              { label: 'Payment Gateway', status: 'online', uptime: '99.7%' },
              { label: 'CDN', status: 'online', uptime: '100%' },
            ].map(service => (
              <div key={service.label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm text-slate-600">{service.label}</span>
                </div>
                <span className="text-xs text-green-400 font-medium">{service.uptime}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-purple-500" /> User Distribution
          </h2>
          <div className="space-y-4">
            {[
              { role: 'Developer', count: users.filter(u => u.role === 'developer').length, color: '#FF6B6B' },
              { role: 'Manager', count: users.filter(u => u.role === 'manager').length, color: '#6C3CE1' },
              { role: 'User', count: users.filter(u => u.role === 'user').length, color: '#10B981' },
            ].map(item => (
              <div key={item.role}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-600">{item.role}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${users.length ? (item.count / users.length) * 100 : 0}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5 text-purple-500" /> Quick Actions
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Manage Users', href: '/admin/users', desc: 'CRUD users & roles' },
              { label: 'Manage Designs', href: '/manager/designs', desc: 'View all designs' },
              { label: 'View Orders', href: '/manager/orders', desc: 'All orders' },
              { label: 'System Config', href: '#', desc: 'App settings' },
            ].map(action => (
              <Link key={action.label} href={action.href} className="block p-3 rounded-xl transition-all hover:bg-purple-50" style={{ background: '#F8F9FC', border: '1px solid rgba(108, 60, 225, 0.1)' }}>
                <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                <p className="text-xs text-slate-400">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-purple-500" /> Recent Orders
        </h2>
        <div className="space-y-3">
          {orders.slice(0, 6).map((order, i) => (
            <div key={order.id || i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#F8F9FC' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: order.status === 'completed' ? '#10B981' : order.status === 'pending' ? '#F59E0B' : '#6C3CE1' }} />
              <div className="flex-1">
                <p className="text-sm text-slate-600">{order.id} — {order.user_name || 'Unknown'} ({(order.items || []).length} item) — {formatPrice(order.total_price)}</p>
                <p className="text-xs text-slate-400 mt-1">{order.created_at} • <span className={`${statusColors[order.status]}`}>{order.status}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
