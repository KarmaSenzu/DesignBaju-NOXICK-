'use client';
import Link from 'next/link';
import { SparklesIcon, HeartIcon, BoltIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function AboutPage() {
    return (
        <div>
            {/* Hero */}
            <section className="relative hero-gradient overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium" style={{ background: 'rgba(108, 60, 225, 0.08)', border: '1px solid rgba(108, 60, 225, 0.15)', color: '#6C3CE1' }}>
                                <HeartIcon className="w-4 h-4" />
                                Tentang Kami
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
                                Membuat Desain yang
                                <span className="gradient-text block">Menghidupkan Ide</span>
                            </h1>
                            <p className="text-lg text-slate-500 leading-relaxed mb-8">
                                Noxick Streetwear Design Studio adalah marketplace desain streetwear digital yang didirikan oleh seorang desainer lokal dengan passion besar
                                terhadap seni dan kreativitas. Kami percaya setiap orang berhak mendapatkan desain berkualitas tinggi
                                dengan harga yang terjangkau.
                            </p>
                            <div className="flex gap-4">
                                <Link href="/catalog" className="btn-primary">
                                    Lihat Katalog
                                    <ArrowRightIcon className="w-5 h-5" />
                                </Link>
                                <Link href="/contact" className="btn-secondary">
                                    Hubungi Kami
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="glass-card p-8 text-center">
                                <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-6xl" style={{ background: 'linear-gradient(135deg, rgba(108, 60, 225, 0.1), rgba(255, 107, 107, 0.1))', border: '3px solid rgba(108, 60, 225, 0.15)' }}>
                                    🎨
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Damar Fikrie</h3>
                                <p className="text-purple-500 font-medium mb-3">Founder & Lead Designer</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Desainer profesional dengan pengalaman lebih dari 5 tahun di bidang graphic design,
                                    branding, dan merchandise design. Spesialisasi dalam desain kaos, poster, dan identitas brand.
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                                    ))}
                                    <span className="text-sm text-slate-400 ml-2">4.8/5 rating</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-20 -left-40 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(108, 60, 225, 0.3), transparent)' }} />
            </section>

            {/* Story */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Cerita Kami</h2>
                    <p className="text-slate-500 leading-relaxed">
                        Berawal dari hobi mendesain kaos untuk komunitas lokal, Noxick Streetwear berkembang menjadi marketplace
                        desain digital yang melayani ratusan customer dari seluruh Indonesia. Setiap desain dibuat dengan
                        penuh perhatian pada detail dan kualitas, memastikan hasil cetak yang sempurna.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="glass-card p-8 text-center">
                        <div className="text-4xl mb-4">🚀</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">2024</h3>
                        <p className="text-sm text-slate-500">Memulai perjalanan sebagai desainer freelance, mengerjakan project kaos untuk brand lokal.</p>
                    </div>
                    <div className="glass-card p-8 text-center">
                        <div className="text-4xl mb-4">💡</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">2025</h3>
                        <p className="text-sm text-slate-500">Meluncurkan Noxick Streetwear sebagai platform marketplace desain streetwear digital untuk memudahkan akses desain berkualitas.</p>
                    </div>
                    <div className="glass-card p-8 text-center">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">2026</h3>
                        <p className="text-sm text-slate-500">Sudah melayani 1000+ customer dengan 500+ desain premium dan terus berkembang.</p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Nilai-Nilai Kami</h2>
                    <p className="text-slate-500">Prinsip yang kami pegang dalam setiap pekerjaan</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: <SparklesIcon className="w-8 h-8" />, title: 'Kualitas Premium', desc: 'Setiap desain melalui proses quality check ketat sebelum dipublikasikan.' },
                        { icon: <HeartIcon className="w-8 h-8" />, title: 'Passion & Dedikasi', desc: 'Kami mencintai apa yang kami kerjakan dan itu tercermin di setiap karya.' },
                        { icon: <BoltIcon className="w-8 h-8" />, title: 'Pelayanan Cepat', desc: 'Respon cepat untuk setiap pertanyaan dan custom order yang masuk.' },
                        { icon: <UserGroupIcon className="w-8 h-8" />, title: 'Customer First', desc: 'Kepuasan customer adalah prioritas utama kami dalam berkarya.' },
                    ].map(val => (
                        <div key={val.title} className="glass-card p-6 text-center group hover:border-purple-300/40 transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500 group-hover:scale-110 transition-transform" style={{ background: 'rgba(108, 60, 225, 0.06)' }}>
                                {val.icon}
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-2">{val.title}</h3>
                            <p className="text-sm text-slate-500">{val.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(108, 60, 225, 0.06), rgba(255, 107, 107, 0.04))', border: '1px solid rgba(108, 60, 225, 0.08)' }}>
                    <h2 className="text-3xl font-bold text-slate-800 mb-8">Dalam Angka</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '500+', label: 'Desain Premium' },
                            { value: '1.2K+', label: 'Customer Puas' },
                            { value: '3.5K+', label: 'Total Download' },
                            { value: '4.8', label: 'Rating Rata-rata' },
                        ].map(stat => (
                            <div key={stat.label}>
                                <p className="text-3xl md:text-4xl font-black gradient-text">{stat.value}</p>
                                <p className="text-sm text-slate-500 mt-2">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Siap Memulai?</h2>
                    <p className="text-slate-500 mb-8 max-w-xl mx-auto">
                        Jelajahi koleksi desain kami atau hubungi untuk custom order. Kami siap membantu mewujudkan visi kreatif Anda.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link href="/catalog" className="btn-primary text-base px-8 py-3.5">
                            Jelajahi Katalog
                        </Link>
                        <Link href="/custom-order" className="btn-accent text-base px-8 py-3.5">
                            Custom Order
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
