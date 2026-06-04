'use client';
import { useState } from 'react';
import { EnvelopeIcon, MapPinIcon, PhoneIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div>
            {/* Header */}
            <section className="hero-gradient">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
                        Hubungi <span className="gradient-text">Kami</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Ada pertanyaan, saran, atau ingin diskusi project? Kami senang mendengar dari Anda!
                    </p>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-4">
                        {[
                            {
                                icon: <EnvelopeIcon className="w-6 h-6" />,
                                title: 'Email',
                                info: 'hello@noxick.com',
                                sub: 'Respon dalam 1-2 jam',
                            },
                            {
                                icon: <PhoneIcon className="w-6 h-6" />,
                                title: 'WhatsApp',
                                info: '+62 812-3456-7890',
                                sub: 'Senin - Sabtu, 09:00 - 21:00',
                            },
                            {
                                icon: <MapPinIcon className="w-6 h-6" />,
                                title: 'Lokasi',
                                info: 'Jakarta, Indonesia',
                                sub: 'Remote-first studio',
                            },
                        ].map(contact => (
                            <div key={contact.title} className="glass-card p-6 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-purple-500 flex-shrink-0" style={{ background: 'rgba(108, 60, 225, 0.06)' }}>
                                    {contact.icon}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">{contact.title}</h3>
                                    <p className="text-sm text-purple-500 font-medium">{contact.info}</p>
                                    <p className="text-xs text-slate-400 mt-1">{contact.sub}</p>
                                </div>
                            </div>
                        ))}

                        {/* Social Media */}
                        <div className="glass-card p-6">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Follow Kami</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { name: 'Instagram', handle: '@noxickwear', icon: '📸' },
                                    { name: 'Twitter', handle: '@noxickwear', icon: '🐦' },
                                    { name: 'Dribbble', handle: 'noxick', icon: '🏀' },
                                    { name: 'Behance', handle: 'noxick', icon: '🎨' },
                                ].map(social => (
                                    <a key={social.name} href="#" className="flex items-center gap-2 p-3 rounded-xl text-sm hover:bg-purple-50 transition-colors" style={{ background: '#F8F9FC', border: '1px solid rgba(108, 60, 225, 0.06)' }}>
                                        <span>{social.icon}</span>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">{social.name}</p>
                                            <p className="text-[10px] text-slate-400">{social.handle}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        {submitted ? (
                            <div className="glass-card p-12 text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <CheckCircleIcon className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">Pesan Terkirim!</h2>
                                <p className="text-slate-500 mb-6">Terima kasih sudah menghubungi kami. Kami akan membalas pesan Anda sesegera mungkin.</p>
                                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="btn-primary">
                                    Kirim Pesan Lagi
                                </button>
                            </div>
                        ) : (
                            <div className="glass-card p-8">
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Kirim Pesan</h2>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-600 mb-2 block">Nama *</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="Nama Anda"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-600 mb-2 block">Email *</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                placeholder="email@example.com"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-600 mb-2 block">Subjek *</label>
                                        <select
                                            value={form.subject}
                                            onChange={e => setForm({ ...form, subject: e.target.value })}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Pilih subjek</option>
                                            <option value="general">Pertanyaan Umum</option>
                                            <option value="order">Pertanyaan Pesanan</option>
                                            <option value="custom">Custom Order</option>
                                            <option value="partnership">Kerjasama / Partnership</option>
                                            <option value="refund">Refund / Komplain</option>
                                            <option value="other">Lainnya</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-600 mb-2 block">Pesan *</label>
                                        <textarea
                                            value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })}
                                            placeholder="Tulis pesan Anda di sini..."
                                            rows={6}
                                            className="input-field resize-none"
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn-primary w-full py-3.5 text-base">
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                        Kirim Pesan
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
