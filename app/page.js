'use client';
import Link from 'next/link';
import { formatPrice, testimonials } from '@/lib/mockData';
import DesignCard from '@/components/DesignCard';
import { useTheme } from '@/lib/theme';
import themeStyles from '@/lib/themeStyles';
import { ArrowRightIcon, SparklesIcon, ShieldCheckIcon, BoltIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useMemo } from 'react';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [apiDesigns, setApiDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [soldIds, setSoldIds] = useState(new Set());
  const { isDark } = useTheme();
  const t = themeStyles(isDark);

  // Fetch designs, categories, and sold items from API
  useEffect(() => {
    fetch('/api/designs')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(d => ({
            id: `api-${d.id}`,
            title: d.title,
            description: d.description || '',
            price: d.price,
            category_id: d.category_id,
            category: d.category_name || 'Lainnya',
            tags: typeof d.tags === 'string' ? JSON.parse(d.tags || '[]') : (d.tags || []),
            preview_image: d.preview_image || 'https://via.placeholder.com/600x400?text=No+Preview',
            mockup_images: typeof d.mockup_images === 'string' ? JSON.parse(d.mockup_images || '[]') : (d.mockup_images || []),
            file_formats: typeof d.file_formats === 'string' ? JSON.parse(d.file_formats || '[]') : (d.file_formats || []),
            created_by: d.created_by || 'Manager',
            created_at: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            downloads: d.downloads || 0,
            rating: d.rating || 0,
            reviews: d.reviews || 0,
          }));
          setApiDesigns(mapped);
        }
      })
      .catch(() => {});

    // Fetch categories from API
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {});

    // Fetch sold item IDs
    fetch('/api/sold-items')
      .then(r => r.json())
      .then(data => {
        if (data.sold_ids) {
          setSoldIds(new Set(data.sold_ids.map(id => String(id))));
        }
      })
      .catch(() => {});
  }, []);

  const designs = useMemo(() => {
    return apiDesigns;
  }, [apiDesigns]);

  const featuredDesigns = useMemo(() => {
    const sorted = [...designs].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 8);
    sorted.sort((a, b) => {
      const aSold = soldIds.has(String(a.id)) ? 1 : 0;
      const bSold = soldIds.has(String(b.id)) ? 1 : 0;
      return aSold - bSold;
    });
    return sorted;
  }, [designs, soldIds]);

  const newDesigns = useMemo(() => {
    const sorted = [...designs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);
    sorted.sort((a, b) => {
      const aSold = soldIds.has(String(a.id)) ? 1 : 0;
      const bSold = soldIds.has(String(b.id)) ? 1 : 0;
      return aSold - bSold;
    });
    return sorted;
  }, [designs, soldIds]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium" style={{ background: t.pillBg, border: `1px solid ${t.pillBorder}`, color: t.pillColor }}>
              <SparklesIcon className="w-4 h-4" />
              Marketplace Desain Digital #1
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-800 mb-6 leading-tight">
              Temukan Desain
              <span className="gradient-text block">Yang Menginspirasi</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
              Jelajahi ratusan desain berkualitas tinggi untuk baju, celana, jaket, sweater, dan set lengkap. Beli langsung atau pesan desain custom.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/catalog" className="btn-primary text-base px-8 py-3.5">
                Jelajahi Katalog
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link href="/custom-order" className="btn-secondary text-base px-8 py-3.5">
                Pesan Custom
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: '500+', label: 'Desain' },
              { value: '1.2K', label: 'Customer' },
              { value: '3.5K', label: 'Download' },
              { value: '4.8', label: 'Rating' },
            ].map(stat => (
              <div key={stat.label} className="text-center p-4 rounded-2xl" style={{ background: t.subtleBg, border: `1px solid ${t.borderColor}` }}>
                <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bg Decoration */}
        <div className="absolute top-20 -left-40 w-80 h-80 rounded-full" style={{ background: t.decoCircle1, opacity: t.decoOpacity }} />
        <div className="absolute bottom-20 -right-40 w-80 h-80 rounded-full" style={{ background: t.decoCircle2, opacity: t.decoOpacity }} />
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Cara Kerja</h2>
          <p className="text-slate-500 mt-2">3 langkah mudah untuk mendapatkan desain impian Anda</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <MagnifyingGlassIcon className="w-8 h-8" />, step: '01', title: 'Pilih Desain', desc: 'Jelajahi katalog dan temukan desain yang sesuai dengan kebutuhan Anda. Gunakan filter untuk mempermudah pencarian.' },
            { icon: <CreditCardIcon className="w-8 h-8" />, step: '02', title: 'Bayar dengan Mudah', desc: 'Lakukan pembayaran melalui berbagai metode: Bank Transfer, Kartu Kredit, atau E-Wallet. Aman dan cepat.' },
            { icon: <ArrowDownTrayIcon className="w-8 h-8" />, step: '03', title: 'Download & Gunakan', desc: 'File desain langsung bisa didownload setelah pembayaran. Tersedia dalam berbagai format siap cetak.' },
          ].map(item => (
            <div key={item.step} className="relative glass-card p-8 text-center group hover:border-purple-300/50 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }}>
                  Step {item.step}
                </span>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-2 text-purple-500 group-hover:scale-110 transition-transform" style={{ background: t.subtleBg3 }}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Kategori Desain</h2>
            <p className="text-slate-500 mt-1">Jelajahi desain berdasarkan kategori produk</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} href={`/catalog?category=${cat.name}`} className="glass-card-hover text-center p-4 group cursor-pointer">
              <span className="text-3xl block mb-2">{cat.icon}</span>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-600 transition-colors">{cat.name}</span>
              <span className="text-xs text-slate-400 block mt-1">{cat.count} desain</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Designs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Desain Populer</h2>
            <p className="text-slate-500 mt-1">Desain terlaris yang disukai banyak orang</p>
          </div>
          <Link href="/catalog" className="btn-secondary text-sm">
            Lihat Semua
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {featuredDesigns.map(design => (
            <DesignCard key={design.id} design={design} isSoldOut={soldIds.has(String(design.id))} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Baru Ditambahkan</h2>
            <p className="text-slate-500 mt-1">Desain terbaru yang fresh dari studio kami</p>
          </div>
          <Link href="/catalog" className="btn-secondary text-sm">
            Lihat Semua
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {newDesigns.map(design => (
            <DesignCard key={design.id} design={design} isSoldOut={soldIds.has(String(design.id))} />
          ))}
        </div>
      </section>

      {/* About / Personal Branding */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl overflow-hidden" style={{ background: t.sectionGradient, border: `1px solid ${t.sectionGradientBorder}` }}>
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-medium" style={{ background: t.pillBg, border: `1px solid ${t.pillBorder}`, color: t.pillColor }}>
                ✨ Tentang Desainer
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Dibuat oleh Desainer Profesional</h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Halo! Saya Damar Fikrie, desainer di balik semua karya di DesignBaju. Dengan pengalaman lebih dari 5 tahun
                di bidang graphic design, saya menghadirkan desain-desain berkualitas tinggi yang siap cetak untuk berbagai kebutuhan Anda.
              </p>
              <p className="text-slate-500 leading-relaxed mb-6">
                Setiap desain dibuat dengan penuh perhatian pada detail, memastikan hasil cetak sempurna di berbagai media.
              </p>
              <div className="flex gap-3">
                <Link href="/about" className="btn-primary text-sm">
                  Tentang Kami
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link href="/portfolio" className="btn-secondary text-sm">
                  Lihat Portfolio
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="glass-card p-6 text-center max-w-xs w-full">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl" style={{ background: t.sectionGradient, border: `3px solid ${t.sectionGradientBorder}` }}>
                  🎨
                </div>
                <h3 className="text-lg font-bold text-slate-800">Damar Fikrie</h3>
                <p className="text-sm text-purple-500 font-medium mb-3">Founder & Lead Designer</p>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">4.8</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '500+', label: 'Desain' },
                    { value: '1.2K', label: 'Customer' },
                    { value: '5+', label: 'Tahun' },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-lg" style={{ background: t.subtleBg }}>
                      <p className="text-sm font-bold gradient-text">{s.value}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Apa Kata Mereka?</h2>
          <p className="text-slate-500 mt-2">Testimoni dari customer yang sudah merasakan kualitas desain kami</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(t2 => (
            <div key={t2.id} className="glass-card p-6 hover:border-purple-300/40 transition-all duration-300">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className={`w-4 h-4 ${i < t2.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t2.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: t.subtleBg3 }}>
                  {t2.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t2.name}</p>
                  <p className="text-xs text-slate-400">{t2.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Kenapa DesignBaju?</h2>
          <p className="text-slate-500 mt-2">Platform terpercaya untuk kebutuhan desain Anda</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <SparklesIcon className="w-8 h-8" />,
              title: 'Desain Premium',
              desc: 'Semua desain dibuat oleh desainer profesional dengan kualitas tinggi dan siap cetak.',
            },
            {
              icon: <BoltIcon className="w-8 h-8" />,
              title: 'Instant Download',
              desc: 'Download file desain langsung setelah pembayaran. Termasuk PSD, AI, SVG, dan PNG.',
            },
            {
              icon: <ShieldCheckIcon className="w-8 h-8" />,
              title: 'Secure & Licensed',
              desc: 'Semua desain dilisensikan untuk penggunaan komersial. Transaksi dijamin aman.',
            },
          ].map(feat => (
            <div key={feat.title} className="glass-card p-8 text-center group hover:border-purple-300/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-purple-500 group-hover:scale-110 transition-transform" style={{ background: t.subtleBg3 }}>
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card p-8 md:p-12 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Dapatkan Update Desain Terbaru</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Subscribe newsletter kami dan dapatkan notifikasi untuk desain baru, promo eksklusif, dan tips desain langsung ke inbox Anda.
          </p>
          {subscribed ? (
            <div className="text-green-600 font-semibold">
              ✅ Terima kasih! Anda sudah berlangganan newsletter kami.
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="input-field flex-1"
                required
              />
              <button type="submit" className="btn-primary px-6 py-3 whitespace-nowrap">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center" style={{ background: t.ctaGradient, border: `1px solid ${t.ctaBorder}` }}>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Butuh Desain Custom?
          </h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Ceritakan ide desain Anda dan desainer kami akan membuatkannya untuk Anda. Mulai dari baju, celana, jaket, hingga set lengkap.
          </p>
          <Link href="/custom-order" className="btn-accent text-base px-8 py-3.5">
            Pesan Sekarang
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
