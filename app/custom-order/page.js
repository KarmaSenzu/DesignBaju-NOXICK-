'use client';
import { useState, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { PaperAirplaneIcon, PhotoIcon, CheckCircleIcon, CreditCardIcon, ChatBubbleLeftRightIcon, ArrowRightIcon, ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/mockData';

const PRODUCT_TYPES = [
  { name: 'Baju', dp: 50000, icon: '👕' },
  { name: 'Celana', dp: 50000, icon: '👖' },
  { name: 'Jaket & Sweater', dp: 75000, icon: '🧥' },
  { name: '1 Set (Baju + Celana)', dp: 100000, icon: '👔' },
  { name: 'Custom Lainnya', dp: 50000, icon: '✨' },
];

export default function CustomOrderPage() {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [waRedirectUrl, setWaRedirectUrl] = useState('');
  const [uploadingRef, setUploadingRef] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    product_type: '',
    description: '',
    deadline: '',
    phone: '',
    contact_info: '',
    reference: null,
  });

  const selectedProduct = PRODUCT_TYPES.find(p => p.name === form.product_type);
  const dpAmount = selectedProduct?.dp || 0;

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Handle reference image upload
  const handleReferenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File terlalu besar. Maksimal 10MB.'); return; }

    setUploadingRef(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'preview');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        updateForm('reference', data.url);
      } else {
        alert('Gagal upload: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload gagal: ' + err.message);
    } finally {
      setUploadingRef(false);
    }
  };

  // Step 1: Submit form → create custom order
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: form.product_type,
          description: form.description,
          deadline: form.deadline || null,
          phone: form.phone,
          contact_info: form.contact_info || null,
          reference_image: form.reference || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pesanan');

      setCreatedOrder({ ...data.order, dp_amount: dpAmount });
      setCurrentStep(2);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Pay DP
  const handlePayDP = async () => {
    if (!createdOrder || isProcessing) return;
    setIsProcessing(true);

    const dpOrderId = `CUSTDP-${createdOrder.id}`;

    // Try Midtrans
    if (typeof window !== 'undefined' && window.snap) {
      try {
        const tokenRes = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: dpOrderId,
            gross_amount: createdOrder.dp_amount,
            items: [{ id: createdOrder.id, title: `DP Custom - ${createdOrder.product_type}`, price: createdOrder.dp_amount, quantity: 1 }],
            customer: { name: currentUser?.name, email: currentUser?.email },
          }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.success && tokenData.token) {
          window.snap.pay(tokenData.token, {
            onSuccess: async () => {
              await markDPPaid(dpOrderId);
            },
            onPending: async () => {
              await markDPPaid(dpOrderId);
            },
            onError: () => { alert('Pembayaran DP gagal.'); setIsProcessing(false); },
            onClose: () => { setIsProcessing(false); },
          });
          return;
        }
      } catch (err) {
        console.warn('Midtrans not available:', err);
      }
    }

    // Fallback: direct DP paid
    await markDPPaid(null);
  };

  const markDPPaid = async (dpOrderId) => {
    try {
      await fetch('/api/custom-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdOrder.id, status: 'dp_paid', midtrans_dp_id: dpOrderId }),
      });
      prepareWhatsAppRedirect();
      setCurrentStep(3);
    } catch (err) {
      alert('Gagal memproses DP: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const prepareWhatsAppRedirect = () => {
    const managerNumber = process.env.NEXT_PUBLIC_MANAGER_WA_NUMBER || '628xxxxxxxxxx';
    const message = `Halo admin, saya sudah bayar DP untuk custom order.

🧾 *Order ID:* #${createdOrder.id}
📦 *Jenis Produk:* ${createdOrder.product_type}
💰 *DP Dibayar:* Rp ${Number(createdOrder.dp_amount).toLocaleString('id-ID')}
📝 *Deskripsi Desain:*
${form.description}
📱 *No. Telp:* ${form.phone}
${form.deadline ? `📅 *Deadline:* ${form.deadline}` : ''}

Mohon diproses ya, terima kasih 🙏`;

    setWaRedirectUrl(`https://wa.me/${managerNumber}?text=${encodeURIComponent(message)}`);
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Login Diperlukan</h1>
        <p className="text-slate-500 mb-6">Login terlebih dahulu untuk membuat custom order</p>
        <Link href="/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Detail Pesanan' },
    { num: 2, label: 'Bayar DP' },
    { num: 3, label: 'Hubungi Admin' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        strategy="lazyOnload"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Custom Order</h1>
        <p className="text-slate-500 mt-1">Pesan desain custom sesuai keinginan Anda</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{ background: currentStep >= s.num ? 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' : '#F1F3F9', color: currentStep >= s.num ? '#FFF' : '#94A3B8' }}>
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${currentStep >= s.num ? 'text-purple-600' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-0.5 mx-2 rounded" style={{ background: currentStep > s.num ? '#6C3CE1' : '#E2E8F0' }} />
            )}
          </div>
        ))}
      </div>

      {/* ═══ Step 1: Form ═══ */}
      {currentStep === 1 && (
        <div className="glass-card p-8">
          <form onSubmit={handleSubmitForm} className="space-y-6">

            {/* Product Type Selection */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-3 block">Jenis Produk *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRODUCT_TYPES.map(p => (
                  <button key={p.name} type="button" onClick={() => updateForm('product_type', p.name)}
                    className={`p-4 rounded-2xl text-center transition-all border-2 ${form.product_type === p.name
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-transparent hover:border-purple-200'}`}
                    style={{ background: form.product_type === p.name ? 'rgba(108, 60, 225, 0.06)' : '#F8F9FC' }}>
                    <span className="text-2xl block mb-1">{p.icon}</span>
                    <span className="text-sm font-semibold text-slate-700 block">{p.name}</span>
                    <span className="text-xs font-bold text-purple-600 block mt-1">DP {formatPrice(p.dp)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DP Info Banner */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(108, 60, 225, 0.04)', border: '1px solid rgba(108, 60, 225, 0.12)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(108, 60, 225, 0.1)' }}>
                  {selectedProduct.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-500">DP wajib dibayar untuk memulai proses</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold gradient-text">{formatPrice(dpAmount)}</p>
                  <p className="text-[10px] text-slate-400">Down Payment</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Deskripsi Desain *</label>
              <textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
                placeholder="Jelaskan desain yang Anda inginkan secara detail: tema, warna, gaya, elemen, tulisan, dll..."
                rows={5} className="input-field resize-none" required />
            </div>

            {/* Phone + Contact */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Nomor Telepon / WhatsApp *</label>
                <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)}
                  placeholder="08xxxxxxxxxx" className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Kontak Lain (opsional)</label>
                <input type="text" value={form.contact_info} onChange={e => updateForm('contact_info', e.target.value)}
                  placeholder="Instagram, Telegram, dll" className="input-field" />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Deadline (opsional)</label>
              <input type="date" value={form.deadline} onChange={e => updateForm('deadline', e.target.value)}
                className="input-field" min={new Date().toISOString().split('T')[0]} />
            </div>

            {/* Reference Image */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Referensi Gambar (opsional)</label>
              {form.reference ? (
                <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(108, 60, 225, 0.15)' }}>
                  <img src={form.reference} alt="Referensi" className="w-full max-h-48 object-contain bg-slate-50" />
                  <button type="button" onClick={() => { updateForm('reference', null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600">✕ Hapus</button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400/50 transition-all"
                  style={{ borderColor: 'rgba(108, 60, 225, 0.15)', background: 'rgba(108, 60, 225, 0.02)' }}
                  onClick={() => fileInputRef.current?.click()}>
                  {uploadingRef ? (
                    <><svg className="animate-spin w-10 h-10 mx-auto text-purple-500 mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><p className="text-sm text-purple-500">Mengupload...</p></>
                  ) : (
                    <><PhotoIcon className="w-10 h-10 mx-auto text-slate-400 mb-3" /><p className="text-sm text-slate-500">Klik untuk upload referensi gambar</p><p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF (max 10MB)</p></>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleReferenceUpload} />
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-base"
              disabled={isProcessing || !form.product_type || !form.description || !form.phone}>
              {isProcessing ? 'Memproses...' : (
                <span className="flex items-center justify-center gap-2">
                  Lanjut Bayar DP {dpAmount > 0 ? formatPrice(dpAmount) : ''}
                  <ArrowRightIcon className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ═══ Step 2: Pay DP ═══ */}
      {currentStep === 2 && createdOrder && (
        <div className="glass-card p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(108, 60, 225, 0.1)' }}>
            <CreditCardIcon className="w-8 h-8 text-purple-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bayar DP Custom Order</h2>
            <p className="text-slate-500">Bayar DP untuk memulai proses desain Anda</p>
          </div>

          <div className="max-w-sm mx-auto glass-card p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Order ID</span>
              <span className="text-slate-800 font-mono font-medium">#{createdOrder.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Produk</span>
              <span className="text-slate-800">{createdOrder.product_type}</span>
            </div>
            <div className="pt-3" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.08)' }}>
              <div className="flex justify-between">
                <span className="text-slate-700 font-semibold">Down Payment</span>
                <span className="text-xl font-bold gradient-text">{formatPrice(createdOrder.dp_amount)}</span>
              </div>
            </div>
          </div>

          <button onClick={handlePayDP} className="btn-accent py-3.5 px-10 text-base mx-auto" disabled={isProcessing}>
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Memproses...
              </span>
            ) : `Bayar DP ${formatPrice(createdOrder.dp_amount)}`}
          </button>

          <button onClick={() => setCurrentStep(1)} className="text-sm text-slate-500 hover:text-purple-600 transition-colors">
            <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> Kembali
          </button>
        </div>
      )}

      {/* ═══ Step 3: Success + WhatsApp ═══ */}
      {currentStep === 3 && createdOrder && (
        <div className="glass-card p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">DP Berhasil Dibayar!</h2>
            <p className="text-slate-500">Sekarang hubungi admin via WhatsApp untuk diskusi desain dan negosiasi harga final.</p>
          </div>

          <div className="max-w-sm mx-auto glass-card p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span className="text-slate-800 font-mono font-bold">#{createdOrder.id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Produk</span><span className="text-slate-800">{createdOrder.product_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">DP Dibayar</span><span className="text-green-600 font-bold">{formatPrice(createdOrder.dp_amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-600">DP Paid</span></div>
          </div>

          <div className="space-y-3">
            <a href={waRedirectUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl text-white font-bold text-base transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Chat Admin via WhatsApp
            </a>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Klik tombol di atas — pesan berisi detail pesanan Anda sudah otomatis terisi. Tinggal kirim!
            </p>
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)' }}>
            <p className="text-xs text-slate-400 mb-3">Selanjutnya:</p>
            <div className="flex flex-col gap-2 text-xs text-left max-w-sm mx-auto">
              <div className="flex items-start gap-2"><span className="text-purple-500 font-bold">1.</span><span className="text-slate-500">Diskusi desain & deal harga final via WhatsApp</span></div>
              <div className="flex items-start gap-2"><span className="text-purple-500 font-bold">2.</span><span className="text-slate-500">Manager menetapkan harga final di website</span></div>
              <div className="flex items-start gap-2"><span className="text-purple-500 font-bold">3.</span><span className="text-slate-500">Proses pengerjaan desain (status: In Progress)</span></div>
              <div className="flex items-start gap-2"><span className="text-purple-500 font-bold">4.</span><span className="text-slate-500">Desain selesai & pelunasan sisa pembayaran</span></div>
            </div>
          </div>

          <Link href="/dashboard" className="btn-secondary py-2.5 px-6 text-sm inline-block">
            Pantau di Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
