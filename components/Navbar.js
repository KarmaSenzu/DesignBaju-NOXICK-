'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useTheme } from '@/lib/theme';
import NotificationBell from '@/components/NotificationBell';
import { ShoppingCartIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, HeartIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlist } = useWishlist();
  const { isDark, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Katalog' },
    { href: '/portfolio', label: 'Portfolio' },
  ];

  const moreLinks = [
    { href: '/about', label: 'Tentang Kami' },
    { href: '/faq', label: 'FAQ' },
    { href: '/license', label: 'Lisensi' },
    { href: '/contact', label: 'Kontak' },
  ];

  const userLinks = currentUser ? [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/custom-order', label: 'Custom Order' },
  ] : [];

  const managerLinks = currentUser?.role === 'manager' || currentUser?.role === 'developer' ? [
    { href: '/manager', label: 'Manager' },
  ] : [];

  const adminLinks = currentUser?.role === 'developer' ? [
    { href: '/admin', label: 'Admin' },
  ] : [];

  const mainLinks = [...navLinks, ...userLinks, ...managerLinks, ...adminLinks];

  const navBg = isDark ? 'rgba(15, 15, 26, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const navBorder = isDark ? '1px solid rgba(108, 60, 225, 0.15)' : '1px solid rgba(108, 60, 225, 0.08)';
  const navShadow = isDark ? 'none' : '0 1px 12px rgba(0, 0, 0, 0.04)';
  const dropdownBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const dropdownBorder = isDark ? '1px solid rgba(108, 60, 225, 0.2)' : '1px solid rgba(108, 60, 225, 0.1)';
  const dropdownShadow = isDark ? '0 12px 40px rgba(0, 0, 0, 0.3)' : '0 12px 40px rgba(108, 60, 225, 0.1), 0 4px 12px rgba(0,0,0,0.05)';

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: navBg, backdropFilter: 'blur(20px)', borderBottom: navBorder, boxShadow: navShadow }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Noxick" className="w-9 h-9 rounded-xl object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-purple-500/30" />
            <span className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-all duration-300 group-hover:tracking-wider">
              NOXICK
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {mainLinks.map(link => (
              <Link key={link.href} href={link.href} className="relative px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-purple-700 transition-all duration-300 group/link overflow-hidden hover:bg-purple-50">
                <span className="relative z-10">{link.label}</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full bg-purple-500 transition-all duration-300 group-hover/link:w-6" />
              </Link>
            ))}
            {/* More Dropdown */}
            <div className="relative">
              <button onClick={() => { setMoreMenuOpen(!moreMenuOpen); setUserMenuOpen(false); }} className="relative px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300 flex items-center gap-1 group/more">
                Lainnya
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${moreMenuOpen ? 'rotate-180' : 'group-hover/more:rotate-180'}`} />
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden" style={{ background: dropdownBg, border: dropdownBorder, boxShadow: dropdownShadow }}>
                  {moreLinks.map(link => (
                    <Link key={link.href} href={link.href} onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all" title={isDark ? 'Light Mode' : 'Dark Mode'}>
                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            )}

            {/* Notification Bell */}
            {currentUser && (
              <div className="hidden md:block">
                <NotificationBell />
              </div>
            )}

            {/* Wishlist Button */}
            <Link href="/dashboard" className="relative p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all hidden md:flex">
              <HeartIcon className="w-6 h-6" />
              {totalWishlist > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}>
                  {totalWishlist}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all">
              <ShoppingCartIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8A8A)' }}>
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Menu */}
            {currentUser ? (
              <div className="relative hidden md:block">
                <button onClick={() => { setUserMenuOpen(!userMenuOpen); setMoreMenuOpen(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-purple-50 transition-all">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden" style={{ background: dropdownBg, border: dropdownBorder, boxShadow: dropdownShadow }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(108, 60, 225, 0.06)' }}>
                      <p className="text-sm font-medium text-slate-800">{currentUser.name}</p>
                      <p className="text-xs text-slate-400">{currentUser.email}</p>
                      <p className="text-[10px] text-purple-500 font-medium mt-1 capitalize">{currentUser.role}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden md:inline-flex btn-primary text-sm">
                Login
              </Link>
            )}

            {/* Mobile Toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:text-purple-700">
              {mobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)' }}>
            {mainLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)' }}>
              {moreLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
            {currentUser ? (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)' }}>
                <div className="px-4 py-2 text-sm text-slate-500">
                  Logged in as <span className="font-medium text-slate-800">{currentUser.name}</span>
                </div>
                <button onClick={async () => { await logout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block mt-3 btn-primary text-center text-sm">
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
