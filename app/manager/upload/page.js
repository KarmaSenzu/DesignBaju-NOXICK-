'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
    PhotoIcon, ArrowUpTrayIcon, CheckCircleIcon, PlusIcon, TrashIcon,
    SwatchIcon, ArrowsUpDownIcon, StarIcon, XMarkIcon
} from '@heroicons/react/24/outline';

export default function UploadDesignPage() {
    const { currentUser } = useAuth();
    const [step, setStep] = useState('form'); // form | variants | uploading | success
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdDesignId, setCreatedDesignId] = useState(null);

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', price: '', category_id: '',
        tags: '', file_formats: [],
    });

    // Image state
    const [previewImage, setPreviewImage] = useState(null); // { file, url }
    const [designFile, setDesignFile] = useState(null); // { file, name }
    const [galleryImages, setGalleryImages] = useState([]); // [{ file, url }]

    // Variant state
    const [variants, setVariants] = useState([]);
    // Each variant: { id: temp, color_name, color_code, image: {file, url}, gallery: [{file, url}], is_default }

    const [categories, setCategories] = useState([]);
    const [catLoaded, setCatLoaded] = useState(false);
    const previewRef = useRef(null);
    const designRef = useRef(null);
    const galleryRef = useRef(null);

    // Load categories
    if (!catLoaded) {
        fetch('/api/categories').then(r => r.json()).then(data => {
            if (Array.isArray(data)) setCategories(data);
        }).catch(() => {});
        setCatLoaded(true);
    }

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const toggleFormat = (fmt) => {
        setForm(prev => ({
            ...prev,
            file_formats: prev.file_formats.includes(fmt)
                ? prev.file_formats.filter(f => f !== fmt)
                : [...prev.file_formats, fmt]
        }));
    };

    // ─── File Upload Helpers ─────────────────────────────────

    const handlePreviewSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { alert('Maks 20MB untuk preview'); return; }
        setPreviewImage({ file, url: URL.createObjectURL(file) });
    };

    const handleDesignSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) { alert('Maks 100MB untuk file desain'); return; }
        setDesignFile({ file, name: file.name });
    };

    const handleGallerySelect = (e) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.filter(f => f.size <= 20 * 1024 * 1024).map(f => ({
            file: f, url: URL.createObjectURL(f)
        }));
        setGalleryImages(prev => [...prev, ...newImages]);
    };

    const removeGalleryImage = (idx) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== idx));
    };

    // ─── Variant Helpers ─────────────────────────────────────

    const addVariant = () => {
        setVariants(prev => [...prev, {
            id: `temp-${Date.now()}`,
            color_name: '',
            color_code: '#6C3CE1',
            image: null,
            gallery: [],
            is_default: prev.length === 0, // First variant is default
        }]);
    };

    const updateVariant = (idx, field, value) => {
        setVariants(prev => prev.map((v, i) => {
            if (i !== idx) return v;
            if (field === 'is_default' && value) {
                // Unset other defaults
                return { ...v, is_default: true };
            }
            return { ...v, [field]: value };
        }));
        if (field === 'is_default' && value) {
            setVariants(prev => prev.map((v, i) => i === idx ? v : { ...v, is_default: false }));
        }
    };

    const removeVariant = (idx) => {
        setVariants(prev => prev.filter((_, i) => i !== idx));
    };

    const handleVariantImageSelect = (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { alert('Maks 20MB'); return; }
        updateVariant(idx, 'image', { file, url: URL.createObjectURL(file) });
    };

    const handleVariantGallerySelect = (idx, e) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.filter(f => f.size <= 20 * 1024 * 1024).map(f => ({
            file: f, url: URL.createObjectURL(f)
        }));
        updateVariant(idx, 'gallery', [...variants[idx].gallery, ...newImages]);
    };

    const removeVariantGalleryImage = (varIdx, imgIdx) => {
        updateVariant(varIdx, 'gallery', variants[varIdx].gallery.filter((_, i) => i !== imgIdx));
    };

    // ─── Upload a single file to /api/upload ─────────────────

    async function uploadFile(file, type = 'preview') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Upload gagal');
        return data.url || data.path;
    }

    // ─── Submit Everything ───────────────────────────────────

    const handleSubmit = async () => {
        // Validation
        if (!form.title || !form.description || !form.price || !form.category_id) {
            alert('Lengkapi semua field wajib (judul, deskripsi, harga, kategori)');
            return;
        }
        if (!previewImage) {
            alert('Upload gambar preview terlebih dahulu');
            return;
        }

        setIsSubmitting(true);
        setStep('uploading');

        try {
            // 1. Upload preview image
            const previewUrl = await uploadFile(previewImage.file, 'preview');

            // 2. Upload design file (if any)
            let designPath = null;
            if (designFile) {
                designPath = await uploadFile(designFile.file, 'design');
            }

            // 3. Upload gallery images
            const galleryUrls = [];
            for (const img of galleryImages) {
                const url = await uploadFile(img.file, 'preview');
                galleryUrls.push(url);
            }

            // 4. Create design
            const mockupImages = [previewUrl, ...galleryUrls];
            const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);

            const designRes = await fetch('/api/designs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    price: parseInt(form.price),
                    category_id: parseInt(form.category_id),
                    tags: tagsArray,
                    file_formats: form.file_formats,
                    preview_image: previewUrl,
                    design_file: designPath,
                    mockup_images: mockupImages,
                }),
            });

            const designData = await designRes.json();
            if (!designRes.ok) throw new Error(designData.error || 'Gagal menyimpan desain');

            const designId = designData.id;

            // 5. Upload & create variants
            for (let i = 0; i < variants.length; i++) {
                const v = variants[i];
                if (!v.color_name || !v.image) continue;

                // Upload variant main image
                const varImageUrl = await uploadFile(v.image.file, 'preview');

                // Upload variant gallery images
                const varGalleryUrls = [];
                for (const img of v.gallery) {
                    const url = await uploadFile(img.file, 'preview');
                    varGalleryUrls.push(url);
                }

                // Create variant via API
                await fetch('/api/variants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_id: designId,
                        color_name: v.color_name,
                        color_code: v.color_code,
                        image_url: varImageUrl,
                        gallery_images: varGalleryUrls,
                        sort_order: i,
                        is_default: v.is_default,
                    }),
                });
            }

            setCreatedDesignId(designId);
            setStep('success');
        } catch (err) {
            alert('Error: ' + err.message);
            setStep('form');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Success State ───────────────────────────────────────

    if (step === 'success') {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircleIcon className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-3">Desain Berhasil Diupload!</h1>
                <p className="text-slate-500 mb-2">Desain "{form.title}" dengan {variants.length} variant warna telah tersimpan.</p>
                <p className="text-sm text-slate-400 mb-8">ID Desain: #{createdDesignId}</p>
                <div className="flex items-center justify-center gap-4">
                    <Link href={`/design/api-${createdDesignId}`} className="btn-primary">Lihat Desain</Link>
                    <button onClick={() => { setStep('form'); setForm({ title: '', description: '', price: '', category_id: '', tags: '', file_formats: [] }); setPreviewImage(null); setDesignFile(null); setGalleryImages([]); setVariants([]); setCreatedDesignId(null); }} className="btn-secondary">Upload Lagi</button>
                </div>
            </div>
        );
    }

    // ─── Uploading State ─────────────────────────────────────

    if (step === 'uploading') {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center">
                <svg className="animate-spin w-16 h-16 mx-auto text-purple-500 mb-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Mengupload...</h2>
                <p className="text-slate-500">Menyimpan desain, gambar, dan variant warna. Mohon tunggu.</p>
            </div>
        );
    }

    // ─── Main Form ───────────────────────────────────────────

    const allFormats = ['PSD', 'AI', 'SVG', 'PNG', 'JPG', 'PDF', 'CDR', 'EPS', 'ZIP'];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Tambah Desain Baru</h1>
                <p className="text-slate-500 text-sm mt-1">Upload desain produk lengkap dengan gambar gallery dan variant warna</p>
            </div>

            {/* ═══ Section 1: Info Dasar ═══ */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }}>1</span>
                    Informasi Produk
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block">Judul Desain *</label>
                        <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="Contoh: Kaos Streetwear Urban Edition" className="input-field" required />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block">Deskripsi *</label>
                        <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Jelaskan desain secara detail..." rows={3} className="input-field resize-none" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block">Harga (IDR) *</label>
                        <input type="number" value={form.price} onChange={e => updateForm('price', e.target.value)} placeholder="150000" className="input-field" min="0" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block">Kategori *</label>
                        <select value={form.category_id} onChange={e => updateForm('category_id', e.target.value)} className="input-field" required>
                            <option value="">Pilih kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block">Tags</label>
                        <input type="text" value={form.tags} onChange={e => updateForm('tags', e.target.value)} placeholder="streetwear, urban, bold (pisah koma)" className="input-field" />
                    </div>

                </div>

                {/* File Formats */}
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Format File</label>
                    <div className="flex flex-wrap gap-2">
                        {allFormats.map(fmt => (
                            <button key={fmt} type="button" onClick={() => toggleFormat(fmt)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${form.file_formats.includes(fmt)
                                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-purple-200'}`}>
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ Section 2: Gambar Produk ═══ */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }}>2</span>
                    Gambar Produk
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Preview Image */}
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Gambar Utama (Preview) *</label>
                        {previewImage ? (
                            <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(108, 60, 225, 0.15)' }}>
                                <img src={previewImage.url} alt="Preview" className="w-full h-48 object-cover" />
                                <button type="button" onClick={() => { setPreviewImage(null); if (previewRef.current) previewRef.current.value = ''; }}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400/50 transition-all"
                                style={{ borderColor: 'rgba(108, 60, 225, 0.15)', background: 'rgba(108, 60, 225, 0.02)' }}
                                onClick={() => previewRef.current?.click()}>
                                <PhotoIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">Klik untuk upload</p>
                                <p className="text-xs text-slate-400">PNG, JPG, WEBP (maks 20MB)</p>
                            </div>
                        )}
                        <input ref={previewRef} type="file" className="hidden" accept="image/*" onChange={handlePreviewSelect} />
                    </div>

                    {/* Design File */}
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">File Desain (Source)</label>
                        {designFile ? (
                            <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ borderColor: 'rgba(108, 60, 225, 0.15)', background: 'rgba(108, 60, 225, 0.02)' }}>
                                <ArrowUpTrayIcon className="w-8 h-8 text-purple-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{designFile.name}</p>
                                    <p className="text-xs text-green-500">✓ File siap diupload</p>
                                </div>
                                <button type="button" onClick={() => { setDesignFile(null); if (designRef.current) designRef.current.value = ''; }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400/50 transition-all"
                                style={{ borderColor: 'rgba(108, 60, 225, 0.15)', background: 'rgba(108, 60, 225, 0.02)' }}
                                onClick={() => designRef.current?.click()}>
                                <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">Upload file sumber</p>
                                <p className="text-xs text-slate-400">PSD, AI, SVG, ZIP (maks 100MB)</p>
                            </div>
                        )}
                        <input ref={designRef} type="file" className="hidden" accept=".psd,.ai,.svg,.png,.zip,.rar,.eps,.cdr,.pdf" onChange={handleDesignSelect} />
                    </div>
                </div>

                {/* Gallery Images */}
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">
                        Galeri Produk <span className="text-slate-400 font-normal">(foto tambahan, mockup, detail)</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {galleryImages.map((img, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border group" style={{ borderColor: 'rgba(108, 60, 225, 0.15)' }}>
                                <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeGalleryImage(idx)}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ))}
                        <div className="w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-400/50 transition-all"
                            style={{ borderColor: 'rgba(108, 60, 225, 0.15)' }}
                            onClick={() => galleryRef.current?.click()}>
                            <PlusIcon className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>
                    <input ref={galleryRef} type="file" className="hidden" accept="image/*" multiple onChange={handleGallerySelect} />
                    <p className="text-xs text-slate-400 mt-2">Tip: Upload foto produk dari berbagai sudut. Foto pertama = tampilan utama di katalog.</p>
                </div>
            </div>

            {/* ═══ Section 3: Variant Warna ═══ */}
            <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }}>3</span>
                        Variant Warna
                    </h2>
                    <button type="button" onClick={addVariant} className="btn-secondary text-sm flex items-center gap-1.5">
                        <PlusIcon className="w-4 h-4" /> Tambah Warna
                    </button>
                </div>

                {variants.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(108, 60, 225, 0.02)', border: '1px dashed rgba(108, 60, 225, 0.15)' }}>
                        <SwatchIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">Belum ada variant warna</p>
                        <p className="text-xs text-slate-400 mt-1">Klik "Tambah Warna" untuk menambahkan pilihan warna produk</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {variants.map((v, idx) => (
                            <div key={v.id} className="p-4 rounded-2xl space-y-3" style={{ background: '#F8F9FC', border: '1px solid rgba(108, 60, 225, 0.08)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg border-2" style={{ backgroundColor: v.color_code, borderColor: 'rgba(0,0,0,0.1)' }} />
                                        <span className="text-sm font-semibold text-slate-700">
                                            {v.color_name || `Warna ${idx + 1}`}
                                        </span>
                                        {v.is_default && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium flex items-center gap-0.5">
                                                <StarIcon className="w-3 h-3" /> Default
                                            </span>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeVariant(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Nama Warna *</label>
                                        <input type="text" value={v.color_name} onChange={e => updateVariant(idx, 'color_name', e.target.value)}
                                            placeholder="Hitam" className="input-field text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Kode Warna</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={v.color_code} onChange={e => updateVariant(idx, 'color_code', e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                                            <input type="text" value={v.color_code} onChange={e => updateVariant(idx, 'color_code', e.target.value)}
                                                className="input-field text-sm flex-1 font-mono" />
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={v.is_default} onChange={e => updateVariant(idx, 'is_default', e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                                            <span className="text-xs text-slate-500">Jadikan default</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Variant Images */}
                                <div>
                                    <label className="text-xs text-slate-500 mb-2 block">Foto Variant *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Main variant image */}
                                        {v.image ? (
                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-300 group">
                                                <img src={v.image.url} alt={v.color_name} className="w-full h-full object-cover" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[8px] text-center py-0.5">UTAMA</div>
                                                <button type="button" onClick={() => updateVariant(idx, 'image', null)}
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400/50 transition-all"
                                                style={{ borderColor: 'rgba(108, 60, 225, 0.2)' }}>
                                                <PhotoIcon className="w-5 h-5 text-slate-400" />
                                                <span className="text-[8px] text-slate-400 mt-0.5">Utama</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => handleVariantImageSelect(idx, e)} />
                                            </label>
                                        )}

                                        {/* Variant gallery images */}
                                        {v.gallery.map((img, gIdx) => (
                                            <div key={gIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border group" style={{ borderColor: 'rgba(108, 60, 225, 0.15)' }}>
                                                <img src={img.url} alt={`${v.color_name} ${gIdx + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeVariantGalleryImage(idx, gIdx)}
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add more variant gallery */}
                                        <label className="w-20 h-20 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-400/50 transition-all"
                                            style={{ borderColor: 'rgba(108, 60, 225, 0.1)' }}>
                                            <PlusIcon className="w-5 h-5 text-slate-400" />
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleVariantGallerySelect(idx, e)} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ Submit ═══ */}
            <div className="glass-card p-6">
                {/* Summary */}
                <div className="flex flex-wrap gap-4 mb-5 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                        <PhotoIcon className="w-4 h-4" />
                        <span>{previewImage ? '1 preview' : '0 preview'} + {galleryImages.length} galeri</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <SwatchIcon className="w-4 h-4" />
                        <span>{variants.length} variant warna</span>
                    </div>
                    {designFile && (
                        <div className="flex items-center gap-2 text-slate-500">
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            <span>1 file desain</span>
                        </div>
                    )}
                </div>

                <button type="button" onClick={handleSubmit} disabled={isSubmitting || !form.title || !form.price || !form.category_id || !previewImage}
                    className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                    {isSubmitting ? 'Mengupload...' : `Upload Desain${variants.length > 0 ? ` + ${variants.length} Variant` : ''}`}
                </button>
            </div>
        </div>
    );
}
