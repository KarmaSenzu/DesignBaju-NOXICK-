'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/mockData';
import Link from 'next/link';
import {
  PencilIcon, TrashIcon, EyeIcon, PlusIcon, MagnifyingGlassIcon,
  XMarkIcon, PhotoIcon, CheckCircleIcon, SwatchIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function ManageDesignsPage() {
  const { currentUser } = useAuth();
  const [designList, setDesignList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Edit modal state
  const [editDesign, setEditDesign] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editPreviewFile, setEditPreviewFile] = useState(null);
  const editPreviewRef = useRef(null);

  // Variant management state
  const [editVariants, setEditVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Fetch designs and categories from DB
  useEffect(() => {
    Promise.all([
      fetch('/api/designs').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([designs, cats]) => {
      if (Array.isArray(designs)) {
        setDesignList(designs.map(d => ({
          ...d,
          tags: (() => { try { return typeof d.tags === 'string' ? JSON.parse(d.tags) : (d.tags || []); } catch { return []; } })(),
          file_formats: (() => { try { return typeof d.file_formats === 'string' ? JSON.parse(d.file_formats) : (d.file_formats || []); } catch { return []; } })(),
          mockup_images: (() => { try { return typeof d.mockup_images === 'string' ? JSON.parse(d.mockup_images) : (d.mockup_images || []); } catch { return []; } })(),
        })));
      }
      if (Array.isArray(cats)) setCategories(cats);
    }).catch(err => {
      console.error('Failed to load data:', err);
    }).finally(() => setLoading(false));
  }, []);

  // ─── Delete ────────────────────────────────────────────────

  const handleDelete = async (design) => {
    const confirmed = confirm(`Hapus desain "${design.title}"?\n\nSemua variant warna juga akan terhapus. Aksi ini tidak bisa dibatalkan.`);
    if (!confirmed) return;

    setDeleting(design.id);
    try {
      const res = await fetch(`/api/designs?id=${design.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert('Gagal menghapus: ' + (data.error || 'Unknown error'));
        return;
      }

      setDesignList(prev => prev.filter(d => d.id !== design.id));
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  // ─── Edit ──────────────────────────────────────────────────

  const openEdit = async (design) => {
    setEditDesign(design);
    setEditForm({
      title: design.title,
      description: design.description || '',
      price: design.price,
      category_id: design.category_id,
      tags: (design.tags || []).join(', '),
      file_formats: design.file_formats || [],
      preview_image: design.preview_image,
    });
    setEditPreviewFile(null);

    // Load variants for this design
    setVariantsLoading(true);
    try {
      const res = await fetch(`/api/variants?product_id=${design.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEditVariants(data);
      }
    } catch { setEditVariants([]); }
    finally { setVariantsLoading(false); }
  };

  const closeEdit = () => {
    setEditDesign(null);
    setEditForm({});
    setEditVariants([]);
    setEditPreviewFile(null);
  };

  const handleEditPreview = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Maks 5MB'); return; }
    setEditPreviewFile({ file, url: URL.createObjectURL(file) });
  };

  const toggleEditFormat = (fmt) => {
    setEditForm(prev => ({
      ...prev,
      file_formats: prev.file_formats.includes(fmt)
        ? prev.file_formats.filter(f => f !== fmt)
        : [...prev.file_formats, fmt]
    }));
  };

  const handleEditSave = async () => {
    if (!editDesign) return;
    setEditSaving(true);

    try {
      let previewUrl = editForm.preview_image;

      // Upload new preview if changed
      if (editPreviewFile) {
        const formData = new FormData();
        formData.append('file', editPreviewFile.file);
        formData.append('type', 'preview');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          previewUrl = uploadData.url;
        }
      }

      const tagsArray = editForm.tags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch('/api/designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editDesign.id,
          title: editForm.title,
          description: editForm.description,
          price: parseInt(editForm.price),
          category_id: parseInt(editForm.category_id),
          tags: tagsArray,
          file_formats: editForm.file_formats,
          preview_image: previewUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert('Gagal menyimpan: ' + (data.error || 'Unknown error'));
        return;
      }

      // Update local state
      setDesignList(prev => prev.map(d => {
        if (d.id !== editDesign.id) return d;
        return {
          ...d,
          title: editForm.title,
          description: editForm.description,
          price: parseInt(editForm.price),
          category_id: parseInt(editForm.category_id),
          category_name: categories.find(c => c.id === parseInt(editForm.category_id))?.name || d.category_name,
          tags: tagsArray,
          file_formats: editForm.file_formats,
          preview_image: previewUrl,
        };
      }));

      closeEdit();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Variant CRUD in edit modal ────────────────────────────

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Hapus variant warna ini?')) return;
    try {
      const res = await fetch(`/api/variants?id=${variantId}`, { method: 'DELETE' });
      if (res.ok) {
        setEditVariants(prev => prev.filter(v => v.id !== variantId));
      }
    } catch (err) {
      alert('Gagal hapus variant: ' + err.message);
    }
  };

  const handleAddVariant = async () => {
    if (!editDesign) return;
    const name = prompt('Nama warna baru (contoh: Hitam):');
    if (!name) return;
    const code = prompt('Kode warna hex (contoh: #1A1A2E):', '#6C3CE1');
    if (!code) return;

    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: editDesign.id,
          color_name: name,
          color_code: code,
          image_url: editDesign.preview_image,
          gallery_images: [],
          sort_order: editVariants.length,
          is_default: editVariants.length === 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditVariants(prev => [...prev, {
          id: data.id,
          product_id: editDesign.id,
          color_name: name,
          color_code: code,
          image_url: editDesign.preview_image,
          gallery_images: [],
          sort_order: editVariants.length,
          is_default: editVariants.length === 0 ? 1 : 0,
        }]);
      }
    } catch (err) {
      alert('Gagal tambah variant: ' + err.message);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'developer')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Akses Ditolak</h1>
        <Link href="/" className="btn-primary">Kembali</Link>
      </div>
    );
  }

  const filtered = designList.filter(d => {
    const matchSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'Semua' || d.category_name === filterCategory;
    return matchSearch && matchCategory;
  });

  const allFormats = ['PSD', 'AI', 'SVG', 'PNG', 'JPG', 'PDF', 'CDR', 'EPS', 'ZIP'];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Kelola Desain</h1>
          <p className="text-slate-500 mt-1">{filtered.length} desain dari database</p>
        </div>
        <Link href="/manager/upload" className="btn-primary">
          <PlusIcon className="w-5 h-5" /> Upload Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Cari desain..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-12" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field w-auto">
          <option value="Semua">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin w-10 h-10 mx-auto text-purple-500 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          <p className="text-slate-500">Memuat desain...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <PhotoIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Desain</h2>
          <p className="text-slate-500 mb-6">Upload desain pertama Anda</p>
          <Link href="/manager/upload" className="btn-primary">Upload Desain</Link>
        </div>
      ) : (
        /* Design Table */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500" style={{ borderBottom: '1px solid rgba(108, 60, 225, 0.1)' }}>
                  <th className="p-4 font-medium">Desain</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium">Harga</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium">Downloads</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(design => (
                  <tr key={design.id} className="table-row" style={{ borderBottom: '1px solid rgba(108, 60, 225, 0.05)' }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={design.preview_image} alt={design.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{design.title}</p>
                          <p className="text-xs text-slate-400">{(design.file_formats || []).join(', ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="badge" style={{ background: 'rgba(108, 60, 225, 0.12)', color: '#8B5CF6', borderColor: 'rgba(108, 60, 225, 0.25)' }}>
                        {design.category_name || '-'}
                      </span>
                    </td>
                    <td className="p-4 gradient-text font-semibold">{formatPrice(design.price)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-800">{design.rating || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{design.downloads || 0}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/design/api-${design.id}`} className="p-2 rounded-lg hover:bg-purple-50 text-slate-500 hover:text-purple-600 transition-all" title="Lihat">
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(design)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(design)} disabled={deleting === design.id}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-all disabled:opacity-50" title="Hapus">
                          {deleting === design.id ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Edit Modal ═══ */}
      {editDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(108, 60, 225, 0.1)' }}>
              <h2 className="text-xl font-bold text-slate-800">Edit Desain</h2>
              <button onClick={closeEdit} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Preview Image */}
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: 'rgba(108, 60, 225, 0.15)' }}>
                  <img src={editPreviewFile?.url || editForm.preview_image} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => editPreviewRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <PhotoIcon className="w-6 h-6 text-white" />
                  </button>
                  <input ref={editPreviewRef} type="file" className="hidden" accept="image/*" onChange={handleEditPreview} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Judul</label>
                    <input type="text" value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Harga (IDR)</label>
                      <input type="number" value={editForm.price || ''} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Kategori</label>
                      <select value={editForm.category_id || ''} onChange={e => setEditForm(p => ({ ...p, category_id: e.target.value }))} className="input-field">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Deskripsi</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Tags (pisah koma)</label>
                <input type="text" value={editForm.tags || ''} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} className="input-field" />
              </div>

              {/* File Formats */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Format File</label>
                <div className="flex flex-wrap gap-2">
                  {allFormats.map(fmt => (
                    <button key={fmt} type="button" onClick={() => toggleEditFormat(fmt)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${(editForm.file_formats || []).includes(fmt)
                        ? 'bg-purple-50 text-purple-600 border-purple-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-purple-200'}`}>
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <SwatchIcon className="w-4 h-4" /> Variant Warna ({editVariants.length})
                  </label>
                  <button type="button" onClick={handleAddVariant} className="text-xs text-purple-600 hover:text-purple-500 font-medium">
                    + Tambah Warna
                  </button>
                </div>

                {variantsLoading ? (
                  <p className="text-xs text-slate-400 py-2">Memuat variant...</p>
                ) : editVariants.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Belum ada variant warna</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {editVariants.map(v => (
                      <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: '#F8F9FC', border: '1px solid rgba(108, 60, 225, 0.08)' }}>
                        <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: v.color_code, borderColor: 'rgba(0,0,0,0.1)' }} />
                        <span className="text-slate-700 font-medium">{v.color_name}</span>
                        {v.is_default ? <span className="text-[9px] text-purple-500 font-bold">DEFAULT</span> : null}
                        <button onClick={() => handleDeleteVariant(v.id)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.1)' }}>
              <button onClick={closeEdit} className="btn-secondary px-6">Batal</button>
              <button onClick={handleEditSave} disabled={editSaving} className="btn-primary px-6 disabled:opacity-50">
                {editSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircleIcon className="w-4 h-4" /> Simpan Perubahan
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
