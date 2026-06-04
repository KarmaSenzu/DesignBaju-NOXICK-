'use client';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';
import { ThemeProvider } from '@/lib/theme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import DatabaseStatus from '@/components/DatabaseStatus';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isManagerRoute = pathname?.startsWith('/manager');
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [dbError, setDbError] = useState('');

  const checkDatabase = useCallback(async () => {
    try {
      setDbStatus('checking');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.status === 'ok') {
        setDbStatus('connected');
        setDbError('');
      } else {
        setDbStatus('disconnected');
        setDbError(data.message || 'Tidak dapat terhubung ke database');
      }
    } catch (error) {
      setDbStatus('disconnected');
      setDbError(error.name === 'AbortError' 
        ? 'Koneksi timeout - server tidak merespons' 
        : error.message || 'Tidak dapat terhubung ke server');
    }
  }, []);

  useEffect(() => {
    checkDatabase();
  }, [checkDatabase]);

  // Jika DB belum terhubung, tampilkan halaman status
  if (dbStatus !== 'connected') {
    return (
      <ThemeProvider>
        <DatabaseStatus 
          status={dbStatus} 
          onRetry={checkDatabase} 
          errorMessage={dbError} 
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {!isManagerRoute && <Navbar />}
            {!isManagerRoute && <CartSidebar />}
            <main className={isManagerRoute ? "min-h-screen bg-slate-50" : "min-h-screen pt-16"}>
              {children}
            </main>
            {!isManagerRoute && <Footer />}
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
