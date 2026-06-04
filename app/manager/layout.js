'use client';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  ChartBarIcon, 
  PaintBrushIcon, 
  ShoppingBagIcon, 
  PlusCircleIcon,
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Katalog Desain', href: '/manager/designs', icon: PaintBrushIcon },
  { name: 'Tambah Desain', href: '/manager/upload', icon: PlusCircleIcon },
  { name: 'Pesanan Masuk', href: '/manager/orders', icon: ShoppingBagIcon },
];

export default function ManagerLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  const allowedRoles = ['manager', 'developer'];

  useEffect(() => {
    setIsMounted(true);
    if (currentUser && !allowedRoles.includes(currentUser.role)) {
      router.push('/');
    } else if (!currentUser && isMounted) {
      router.push('/login');
    }
  }, [currentUser, router, isMounted]);

  if (!isMounted || !currentUser || !allowedRoles.includes(currentUser.role)) {
    return null; // Will redirect or loading
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/manager/designs" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              M
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700">Manager</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-purple-50 text-purple-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link 
            href="/catalog"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="w-5 h-5 text-slate-400" />
            Lihat Katalog Publik
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <HomeIcon className="w-5 h-5 text-slate-400" />
            Landing Page
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-400" />
            Logout Manager
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-0">
          <h1 className="text-lg font-semibold text-slate-800">
            {navigation.find(n => n.href === pathname)?.name || 'Katalog Desain'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-purple-700 font-bold">{currentUser.name.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto bg-slate-50 relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
