'use client';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/mockData';
import DesignCard from '@/components/DesignCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">Loading katalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'Semua';
  const initialTag = searchParams.get('tag') || '';

  const [searchQuery, setSearchQuery] = useState(initialTag);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [apiDesigns, setApiDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [soldIds, setSoldIds] = useState(new Set());
  const itemsPerPage = 12;

  // Fetch designs, categories, and sold items from API
  useEffect(() => {
    fetch('/api/designs')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(d => ({
            id: d.id,
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
          setSoldIds(new Set(data.sold_ids.map(id => Number(id))));
        }
      })
      .catch(() => {});
  }, []);

  const designs = useMemo(() => {
    return apiDesigns;
  }, [apiDesigns]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    designs.forEach(d => d.tags?.forEach(t => tags.add(t)));
    return [...tags].sort();
  }, [designs]);

  const filteredDesigns = useMemo(() => {
    let result = [...designs];

    if (selectedCategory !== 'Semua') {
      result = result.filter(d => d.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (priceRange === 'under100') result = result.filter(d => d.price < 100000);
    else if (priceRange === '100to200') result = result.filter(d => d.price >= 100000 && d.price <= 200000);
    else if (priceRange === 'over200') result = result.filter(d => d.price > 200000);

    if (sortBy === 'popular') result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    else if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Push sold out items to the bottom
    result.sort((a, b) => {
      const aSold = soldIds.has(a.id) ? 1 : 0;
      const bSold = soldIds.has(b.id) ? 1 : 0;
      return aSold - bSold;
    });

    return result;
  }, [designs, searchQuery, selectedCategory, sortBy, priceRange, soldIds]);

  const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage);
  const paginatedDesigns = filteredDesigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Katalog Desain</h1>
        <p className="text-slate-500">Temukan desain sempurna untuk produk Anda</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari desain, tag, atau kategori..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="input-field pl-12"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 flex-1">
            {['Semua', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
                style={selectedCategory === cat
                  ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }
                  : { background: 'rgba(241, 243, 249, 0.8)', border: '1px solid rgba(108, 60, 225, 0.08)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & Price */}
          <div className="flex gap-2">
            <select
              value={priceRange}
              onChange={e => { setPriceRange(e.target.value); setCurrentPage(1); }}
              className="input-field text-sm py-2 px-3 w-auto"
            >
              <option value="all">Semua Harga</option>
              <option value="under100">Di bawah 100K</option>
              <option value="100to200">100K - 200K</option>
              <option value="over200">Di atas 200K</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field text-sm py-2 px-3 w-auto"
            >
              <option value="popular">Terpopuler</option>
              <option value="newest">Terbaru</option>
              <option value="price-low">Harga Terendah</option>
              <option value="price-high">Harga Tertinggi</option>
              <option value="rating">Rating Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400 mr-1 py-1">Tags populer:</span>
          {allTags.slice(0, 12).map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${searchQuery === tag
                ? 'text-purple-600 bg-purple-50 border-purple-200'
                : 'text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              style={{ border: '1px solid rgba(108, 60, 225, 0.08)' }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          Menampilkan <span className="text-slate-800 font-semibold">{paginatedDesigns.length}</span> dari <span className="text-slate-800 font-semibold">{filteredDesigns.length}</span> desain
          {selectedCategory !== 'Semua' && <span> dalam kategori <span className="text-purple-600">{selectedCategory}</span></span>}
          {searchQuery && <span> untuk &ldquo;<span className="text-purple-600">{searchQuery}</span>&rdquo;</span>}
        </p>
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="text-xs text-purple-600 hover:text-purple-500">
            Clear filter
          </button>
        )}
      </div>

      {/* Design Grid */}
      {paginatedDesigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedDesigns.map(design => (
            <DesignCard key={design.id} design={design} isSoldOut={soldIds.has(design.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Tidak ada desain ditemukan</h3>
          <p className="text-slate-500">Coba ubah filter atau kata kunci pencarian Anda</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${currentPage === i + 1
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-purple-50'
                }`}
              style={currentPage === i + 1 ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' } : {}}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-medium btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
