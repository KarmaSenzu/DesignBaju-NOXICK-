'use client';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

export default function Footer() {
  const { isDark } = useTheme();

  return (
    <footer style={{ background: isDark ? '#0A0A14' : '#F1F3F9', borderTop: `1px solid rgba(108, 60, 225, ${isDark ? '0.1' : '0.06'})` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Noxick" className="w-9 h-9 rounded-xl object-cover" />
              <span className="text-lg font-bold text-slate-800">NOXICK</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Noxick Streetwear Design Studio — Platform marketplace desain streetwear digital terbaik untuk kebutuhan kreasi produk Anda.
            </p>
            <div className="flex items-center gap-3">
              {['Instagram', 'Twitter', 'Dribbble'].map(social => (
                <a key={social} href="#" className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors" style={{ background: `rgba(108, 60, 225, ${isDark ? '0.08' : '0.06'})`, border: `1px solid rgba(108, 60, 225, ${isDark ? '0.1' : '0.08'})` }}>
                  {social.charAt(0)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Marketplace</h4>
            <div className="space-y-2.5">
              {[
                { label: 'Katalog Desain', href: '/catalog' },
                { label: 'Desain Baru', href: '/catalog' },
                { label: 'Custom Order', href: '/custom-order' },
                { label: 'Portfolio', href: '/portfolio' },
              ].map(item => (
                <Link key={item.label} href={item.href} className="block text-sm text-slate-500 hover:text-purple-600 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Informasi</h4>
            <div className="space-y-2.5">
              {[
                { label: 'Tentang Kami', href: '/about' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Hubungi Kami', href: '/contact' },
              ].map(item => (
                <Link key={item.label} href={item.href} className="block text-sm text-slate-500 hover:text-purple-600 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Support</h4>
            <div className="space-y-2.5">
              {[
                { label: 'Cara Membeli', href: '/faq' },
                { label: 'Kebijakan Refund', href: '/faq' },
                { label: 'Syarat & Ketentuan', href: '/faq' },
                { label: 'Kebijakan Privasi', href: '/faq' },
              ].map(item => (
                <Link key={item.label} href={item.href} className="block text-sm text-slate-500 hover:text-purple-600 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid rgba(108, 60, 225, ${isDark ? '0.1' : '0.06'})` }}>
          <p className="text-sm text-slate-400">
            © 2026 Noxick Streetwear Design Studio. All rights reserved. Made with ❤️ by Damar Fikrie
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-slate-400 hover:text-purple-600 transition-colors">About</Link>
            <Link href="/faq" className="text-sm text-slate-400 hover:text-purple-600 transition-colors">FAQ</Link>
            <Link href="/contact" className="text-sm text-slate-400 hover:text-purple-600 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
