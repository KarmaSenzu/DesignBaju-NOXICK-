'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useTheme } from '@/lib/theme';
import { XMarkIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/mockData';

export default function CartSidebar() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, clearCart, totalPrice } = useCart();
  const { isDark } = useTheme();

  if (!isCartOpen) return null;

  const sidebarBg = isDark ? '#12121F' : '#FFFFFF';
  const sidebarBorder = isDark ? '1px solid rgba(108, 60, 225, 0.15)' : '1px solid rgba(108, 60, 225, 0.08)';
  const sidebarShadow = isDark ? '-8px 0 40px rgba(0, 0, 0, 0.3)' : '-8px 0 40px rgba(0, 0, 0, 0.08)';
  const itemBg = isDark ? 'rgba(26, 26, 46, 0.5)' : '#F8F9FC';
  const itemBorder = isDark ? '1px solid rgba(108, 60, 225, 0.1)' : '1px solid rgba(108, 60, 225, 0.06)';
  const dividerBorder = isDark ? '1px solid rgba(108, 60, 225, 0.1)' : '1px solid rgba(108, 60, 225, 0.06)';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md shadow-2xl flex flex-col" style={{ background: sidebarBg, borderLeft: sidebarBorder, boxShadow: sidebarShadow }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: dividerBorder }}>
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="w-6 h-6 text-purple-500" />
            <h2 className="text-lg font-bold text-slate-800">Keranjang</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-purple-600" style={{ background: 'rgba(108, 60, 225, 0.08)' }}>
              {cartItems.length}
            </span>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-slate-700 transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingBagIcon className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Keranjang Kosong</p>
              <p className="text-sm mt-1">Tambahkan desain dari katalog</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl" style={{ background: itemBg, border: itemBorder }}>
                <img src={item.preview_image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{item.title}</h4>
                  <p className="text-xs text-slate-400">{item.category}</p>
                  <p className="text-sm font-bold text-purple-600 mt-1">{formatPrice(item.price)}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all self-start">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 space-y-4" style={{ borderTop: dividerBorder }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-xl font-bold gradient-text">{formatPrice(totalPrice)}</span>
            </div>
            <Link href="/cart" onClick={() => setIsCartOpen(false)} className="btn-primary w-full text-center block py-3">
              Checkout
            </Link>
            <button onClick={clearCart} className="btn-secondary w-full py-2.5 text-sm text-slate-500">
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </div>
    </>
  );
}
