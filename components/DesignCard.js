'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/mockData';

export default function DesignCard({ design, isSoldOut = false }) {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inCart = isInCart(design.id);
  const inWishlist = isInWishlist(design.id);
  const [variants, setVariants] = useState([]);
  const [hoveredImage, setHoveredImage] = useState(null);

  // Fetch variants for this product
  useEffect(() => {
    fetch(`/api/variants?product_id=${design.id}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setVariants(data);
      })
      .catch(() => {});
  }, [design.id]);

  const displayImage = hoveredImage || design.preview_image;

  return (
    <div className={`glass-card-hover group overflow-hidden ${isSoldOut ? 'opacity-75' : ''}`}>
      {/* Image */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F8F9FC 0%, #EEF0F7 100%)' }}
      >
        <img
          src={displayImage}
          alt={design.title}
          className={`w-full h-full object-contain p-2 transition-transform duration-500 ${isSoldOut ? 'grayscale-[40%]' : 'group-hover:scale-105'}`}
        />

        {/* SOLD OUT Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="absolute inset-0 bg-black/40" />
            <div 
              className="relative px-8 py-3 rounded-2xl transform -rotate-12 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
              }}
            >
              <span className="text-white text-2xl font-black tracking-[0.2em] uppercase">SOLD</span>
            </div>
          </div>
        )}

        {/* Hover gradient — only when NOT sold */}
        {!isSoldOut && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Hover Actions — only when NOT sold */}
        {!isSoldOut && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Link href={`/design/${design.id}`} className="btn-primary text-xs py-2 px-4">
              Lihat Detail
            </Link>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.preventDefault(); toggleWishlist(design); }}
                className={`p-2 rounded-xl transition-all ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur text-slate-700 hover:bg-white'}`}
              >
                {inWishlist ? <HeartSolid className="w-5 h-5" /> : <HeartOutline className="w-5 h-5" />}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); if (!inCart) addToCart(design); }}
                className={`p-2 rounded-xl transition-all ${inCart ? 'bg-green-500 text-white' : 'bg-white/80 backdrop-blur text-slate-700 hover:bg-white'}`}
              >
                <ShoppingCartIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(108, 60, 225, 0.85)', backdropFilter: 'blur(8px)' }}>
            {design.category}
          </span>
        </div>

        {/* License & Format Badges */}
        {!isSoldOut && (
          <div className="absolute top-3 right-3 flex gap-1 items-center z-20">
            {(design.file_formats || []).slice(0, 2).map(fmt => (
              <span key={fmt} className="px-2 py-0.5 rounded text-[10px] font-bold text-white/90" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                {fmt}
              </span>
            ))}
          </div>
        )}

        {/* Wishlist indicator (always visible if in wishlist) */}
        {inWishlist && !isSoldOut && (
          <div className="absolute top-3 right-3 group-hover:hidden z-20">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(4px)' }}>
              <HeartSolid className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/design/${design.id}`}>
          <h3 className={`text-base font-semibold mb-1 transition-colors truncate ${isSoldOut ? 'text-slate-400' : 'text-slate-800 group-hover:text-purple-600'}`}>
            {design.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{design.description}</p>

        {/* Mini Color Swatches — only when NOT sold */}
        {variants.length > 0 && !isSoldOut && (
          <div className="flex items-center gap-1.5 mb-3">
            {variants.slice(0, 5).map(v => (
              <button
                key={v.id}
                onMouseEnter={() => setHoveredImage(v.image_url)}
                onMouseLeave={() => setHoveredImage(null)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-125 hover:ring-2 hover:ring-purple-400 hover:ring-offset-1"
                style={{ background: v.color_code, border: '1.5px solid rgba(0,0,0,0.1)' }}
                title={v.color_name}
              />
            ))}
            {variants.length > 5 && (
              <span className="text-[10px] text-slate-400 ml-1">+{variants.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {isSoldOut ? (
            <span className="text-sm font-bold text-red-500 line-through">{formatPrice(design.price)}</span>
          ) : (
            <span className="text-lg font-bold gradient-text">{formatPrice(design.price)}</span>
          )}
          <div className="flex items-center gap-1">
            <StarIcon className={`w-4 h-4 ${isSoldOut ? 'text-slate-300' : 'text-yellow-400'}`} />
            <span className="text-xs text-slate-500">{design.rating || 0}</span>
            <span className="text-xs text-slate-400">({design.reviews || 0})</span>
          </div>
        </div>

        {/* Sold Out indicator at bottom */}
        {isSoldOut && (
          <div className="mt-3 px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Sold Out</span>
          </div>
        )}
      </div>
    </div>
  );
}
