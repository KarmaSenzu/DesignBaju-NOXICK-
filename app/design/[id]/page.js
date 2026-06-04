'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/mockData';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useTheme } from '@/lib/theme';
import themeStyles from '@/lib/themeStyles';
import ImageLightbox from '@/components/ImageLightbox';
import Link from 'next/link';
import { ShoppingCartIcon, ArrowDownTrayIcon, TagIcon, CheckCircleIcon, BoltIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon, ShareIcon, HeartIcon as HeartOutline, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

export default function DesignDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const isApiDesign = String(id).startsWith('api-');
  const numericId = isApiDesign ? parseInt(String(id).replace('api-', '')) : parseInt(id);

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedDesigns, setRelatedDesigns] = useState([]);
  const reviews = []; // No reviews API — show empty state

  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { isDark } = useTheme();
  const t = themeStyles(isDark);

  // Color variant states
  const [variants, setVariants] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [activeGallery, setActiveGallery] = useState([]); // Current gallery images based on selected variant
  const [mainImage, setMainImage] = useState(null); // Currently displayed main image

  // Fetch design from API
  useEffect(() => {
    setLoading(true);
    fetch('/api/designs')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find(d => d.id === numericId);
          if (found) {
            const designObj = {
              id: `api-${found.id}`,
              title: found.title,
              description: found.description || '',
              price: found.price,
              category_id: found.category_id,
              category: found.category_name || 'Lainnya',
              tags: typeof found.tags === 'string' ? JSON.parse(found.tags || '[]') : (found.tags || []),
              preview_image: found.preview_image || 'https://via.placeholder.com/600x400?text=No+Preview',
              mockup_images: typeof found.mockup_images === 'string' ? JSON.parse(found.mockup_images || '[]') : (found.mockup_images || []),
              file_formats: typeof found.file_formats === 'string' ? JSON.parse(found.file_formats || '[]') : (found.file_formats || []),
              created_by: found.created_by || 'Manager',
              created_at: found.created_at ? new Date(found.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              downloads: found.downloads || 0,
              rating: found.rating || 0,
              reviews: found.reviews || 0,
            };
            setDesign(designObj);

            // Load related designs (same category, excluding current)
            const related = data
              .filter(d => d.id !== numericId && d.category_id === found.category_id)
              .slice(0, 4)
              .map(d => ({
                id: `api-${d.id}`,
                title: d.title,
                price: d.price,
                preview_image: d.preview_image || 'https://via.placeholder.com/600x400?text=No+Preview',
              }));
            setRelatedDesigns(related);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [numericId]);

  // Fetch color variants
  useEffect(() => {
    if (!design) return;
    fetch(`/api/variants?product_id=${numericId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setVariants(data);
      })
      .catch(() => {});
  }, [design, numericId]);

  // Set initial preview image
  useEffect(() => {
    if (design && !previewImage) {
      setPreviewImage(design.preview_image);
    }
  }, [design]);

  // Update gallery when variant selection changes
  useEffect(() => {
    if (!design) return;
    const mockupImgs = (() => {
      try {
        if (typeof design.mockup_images === 'string') return JSON.parse(design.mockup_images);
        if (Array.isArray(design.mockup_images)) return design.mockup_images;
        return [];
      } catch { return []; }
    })();

    if (selectedColor) {
      const selectedVariant = variants.find(v => v.color_name === selectedColor.color_name);
      if (selectedVariant) {
        const variantGallery = selectedVariant.gallery_images || [];
        setActiveGallery([selectedVariant.image_url, ...variantGallery]);
        setMainImage(selectedVariant.image_url);
        return;
      }
    }
    // Default: show product gallery
    setActiveGallery([design.preview_image, ...mockupImgs.filter(img => img !== design.preview_image)]);
    setMainImage(design.preview_image);
  }, [design, selectedColor, variants]);

  // Check sold status — compare using numeric ID
  useEffect(() => {
    if (!design) return;
    fetch('/api/sold-items')
      .then(r => r.json())
      .then(data => {
        if (data.sold_ids) {
          const soldSet = new Set(data.sold_ids.map(sid => Number(sid)));
          setIsSoldOut(soldSet.has(numericId));
        }
      })
      .catch(() => {});
  }, [design, numericId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-purple-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          <span className="text-slate-500 text-lg">Memuat desain...</span>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Desain tidak ditemukan</h1>
        <Link href="/catalog" className="btn-primary">Kembali ke Katalog</Link>
      </div>
    );
  }

  const inCart = isInCart(design.id);
  const inWishlist = isInWishlist(design.id);
  const mockupImages = design.mockup_images || [];
  const fileFormats = design.file_formats || [];
  const tags = design.tags || [];

  const currentPreview = previewImage || design.preview_image;

  const handleAddToCart = () => {
    if (!inCart && !isSoldOut) {
      addToCart({
        ...design,
        selected_color: selectedColor?.color_name || null,
      });
    }
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    if (!inCart) {
      addToCart({
        ...design,
        selected_color: selectedColor?.color_name || null,
      });
    }
    router.push('/cart?checkout=1');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/catalog" className="flex items-center gap-1 hover:text-purple-600 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Katalog
        </Link>
        <span>/</span>
        <Link href={`/catalog?category=${design.category}`} className="text-purple-600 hover:text-purple-500">{design.category}</Link>
        <span>/</span>
        <span className="text-slate-800">{design.title}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <div
            className="glass-card overflow-hidden rounded-2xl cursor-pointer group/img relative"
            style={{ background: 'linear-gradient(135deg, #F8F9FC 0%, #EEF0F7 100%)' }}
            onClick={() => { const idx = activeGallery.indexOf(mainImage || design.preview_image); setLightboxIndex(idx >= 0 ? idx : 0); setLightboxOpen(true); }}
          >
            <img src={mainImage || design.preview_image} alt={design.title} className={`w-full aspect-[4/3] object-contain p-4 transition-all duration-500 ${isSoldOut ? 'grayscale-[40%]' : 'group-hover/img:scale-105'}`} />
            {/* SOLD OUT Overlay on Image */}
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="bg-red-600 text-white px-6 py-3 rounded-2xl text-xl font-black tracking-wider transform -rotate-12 shadow-lg">
                  SOLD OUT
                </div>
              </div>
            )}
            {!isSoldOut && (
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 scale-75 group-hover/img:scale-100" style={{ background: 'rgba(108, 60, 225, 0.8)', backdropFilter: 'blur(8px)' }}>
                <MagnifyingGlassPlusIcon className="w-7 h-7 text-white" />
              </div>
            </div>
            )}
          </div>

          {/* Color Variants Swatches */}
          {variants.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Pilih Warna</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map(v => (
                  <button
                    key={v.id}
                    onMouseEnter={() => { if (!selectedColor) setMainImage(v.image_url); }}
                    onMouseLeave={() => { if (!selectedColor) setMainImage(activeGallery[0] || design.preview_image); }}
                    onClick={() => { setSelectedColor(prev => prev?.color_name === v.color_name ? null : v); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
                    style={{
                      background: selectedColor?.id === v.id ? 'rgba(108, 60, 225, 0.08)' : '#F8F9FC',
                      border: selectedColor?.id === v.id ? '2px solid #6C3CE1' : '2px solid transparent',
                    }}
                    title={v.color_name}
                  >
                    <span
                      className="w-6 h-6 rounded-full shadow-inner flex-shrink-0"
                      style={{ background: v.color_code, border: '2px solid rgba(0,0,0,0.1)' }}
                    />
                    <span className="text-xs font-medium text-slate-600">{v.color_name}</span>
                    {selectedColor?.id === v.id && (
                      <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mockup Gallery */}
          <div className="flex flex-wrap gap-3 mt-3">
            {activeGallery.filter(Boolean).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setMainImage(img)}
                onDoubleClick={() => { setLightboxIndex(activeGallery.indexOf(img)); setLightboxOpen(true); }}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${mainImage === img ? 'border-purple-500 ring-2 ring-purple-200' : 'border-transparent hover:border-purple-300'}`}
                style={{ background: 'linear-gradient(135deg, #F8F9FC 0%, #EEF0F7 100%)' }}
              >
                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain p-1" />
              </button>
            ))}
            <div className="glass-card overflow-hidden rounded-xl flex items-center justify-center aspect-square" style={{ background: t.subtleBg }}>
              <span className="text-slate-400 text-sm">+{fileFormats.length} files</span>
            </div>
          </div>
        </div>

        {/* Image Lightbox */}
        <ImageLightbox
          images={activeGallery.length > 0 ? activeGallery : [design.preview_image]}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />

        {/* Info Section */}
        <div className="space-y-6">
          {/* Category Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge" style={{ background: t.categoryBadgeBg, color: t.categoryBadgeColor, borderColor: t.categoryBadgeBorder }}>
              {design.category}
            </span>

          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{design.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-5 h-5 ${i < Math.floor(design.rating || 0) ? 'text-yellow-400' : 'text-slate-200'}`} />
              ))}
              <span className="text-sm text-slate-500 ml-2">{design.rating || 0} ({design.reviews || 0} ulasan)</span>
            </div>
            <span className="text-sm text-slate-300">•</span>
            <span className="text-sm text-slate-500">{design.downloads || 0} downloads</span>
          </div>

          {/* Selected Color Display */}
          {selectedColor && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(108, 60, 225, 0.04)', border: '1px solid rgba(108, 60, 225, 0.1)' }}>
              <span className="w-5 h-5 rounded-full" style={{ background: selectedColor.color_code, border: '2px solid rgba(0,0,0,0.1)' }} />
              <span className="text-sm font-medium text-slate-700">Warna: <span className="text-purple-600">{selectedColor.color_name}</span></span>
            </div>
          )}

          {/* Price */}
          <div className="p-6 rounded-2xl" style={{ background: t.priceBoxBg, border: t.priceBoxBorder }}>
            <p className="text-sm text-slate-500 mb-1">Harga</p>
            <p className="text-3xl font-bold gradient-text">{formatPrice(design.price)}</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Deskripsi</h3>
            <p className="text-slate-500 leading-relaxed">{design.description}</p>
          </div>

          {/* File Formats */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Format File</h3>
            <div className="flex flex-wrap gap-2">
              {fileFormats.map(fmt => (
                <span key={fmt} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: t.formatBg, color: t.formatColor, border: t.formatBorder }}>
                  .{fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Link key={tag} href={`/catalog?tag=${tag}`} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-purple-600 hover:border-purple-300/50 transition-colors" style={{ background: t.tagBg, border: t.tagBorder }}>
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Actions — Cart + Buy Now */}
          {isSoldOut && (
            <div className="w-full py-3 px-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-red-600 font-bold text-sm">Desain ini sudah terjual (Sold Out)</p>
              <p className="text-red-400 text-xs mt-1">Setiap desain hanya tersedia 1 item</p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={isSoldOut || isInCart(design.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all ${isSoldOut
                ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                : inCart
                ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                : 'btn-primary'
                }`}
            >
              {inCart ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Di Keranjang
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-5 h-5" />
                  Tambah ke Keranjang
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isSoldOut}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all ${isSoldOut ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400' : 'btn-accent'}`}
            >
              <BoltIcon className="w-5 h-5" />
              Beli Sekarang
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => toggleWishlist(design)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all ${inWishlist ? 'bg-red-50 text-red-500 border border-red-200' : 'btn-secondary'}`}
            >
              {inWishlist ? <HeartSolid className="w-5 h-5" /> : <HeartOutline className="w-5 h-5" />}
              {inWishlist ? 'Di Wishlist' : 'Wishlist'}
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium">
              <ShareIcon className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Info */}
          <div className="space-y-3 pt-2">
            {[
              'Termasuk file sumber desain',
              'Download instant setelah pembayaran',
              'File resolusi tinggi siap cetak',
              'Support 24/7',
            ].map(info => (
              <div key={info} className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                {info}
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Ulasan ({reviews.length})</h2>
        {reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map(review => (
              <div key={review.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }}>
                      {review.user_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{review.user_name}</p>
                      <p className="text-xs text-slate-400">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-500">{review.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-slate-400">Belum ada ulasan untuk desain ini.</p>
          </div>
        )}
      </div>

      {/* Related Designs */}
      {relatedDesigns.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Desain Terkait</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedDesigns.map(d => (
              <div key={d.id} className="glass-card-hover overflow-hidden group">
                <Link href={`/design/${d.id}`}>
                  <div
                    className="aspect-[4/3] overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #F8F9FC 0%, #EEF0F7 100%)' }}
                  >
                    <img src={d.preview_image} alt={d.title} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">{d.title}</h3>
                    <p className="text-sm font-bold gradient-text mt-1">{formatPrice(d.price)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
