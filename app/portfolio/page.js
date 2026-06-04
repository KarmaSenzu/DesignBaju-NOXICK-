'use client';
import { useState } from 'react';
import { portfolioItems } from '@/lib/mockData';
import Link from 'next/link';
import { ArrowRightIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function PortfolioPage() {
    const [filter, setFilter] = useState('Semua');
    const portfolioCategories = ['Semua', ...new Set(portfolioItems.map(p => p.category))];

    const filtered = filter === 'Semua' ? portfolioItems : portfolioItems.filter(p => p.category === filter);

    return (
        <div>
            {/* Header */}
            <section className="hero-gradient">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
                        Portfolio <span className="gradient-text">Karya Kami</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Beberapa project terbaik yang telah kami kerjakan untuk klien dari berbagai industri.
                    </p>
                </div>
            </section>

            {/* Filter */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {portfolioCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === cat
                                ? 'text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                            style={filter === cat
                                ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }
                                : { background: 'rgba(241, 243, 249, 0.8)', border: '1px solid rgba(108, 60, 225, 0.06)' }
                            }
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Portfolio Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => (
                        <div key={item.id} className="glass-card-hover overflow-hidden group">
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <div>
                                        <span className="badge text-xs mb-2" style={{ background: 'rgba(108, 60, 225, 0.4)', color: '#C4B5FD', borderColor: 'rgba(108, 60, 225, 0.5)' }}>
                                            {item.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium px-2 py-1 rounded-lg text-purple-600" style={{ background: 'rgba(108, 60, 225, 0.06)' }}>
                                        {item.category}
                                    </span>
                                    <span className="text-xs text-slate-400">{item.year}</span>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors">{item.title}</h3>
                                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{item.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Client: {item.client}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="rounded-3xl p-10 md:p-16 text-center" style={{ background: 'linear-gradient(135deg, rgba(108, 60, 225, 0.08), rgba(255, 107, 107, 0.05))', border: '1px solid rgba(108, 60, 225, 0.1)' }}>
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Ingin Project Seperti Ini?</h2>
                    <p className="text-slate-500 mb-8 max-w-xl mx-auto">
                        Ceritakan ide Anda dan kami akan membuatkan desain yang sempurna untuk brand Anda.
                    </p>
                    <Link href="/custom-order" className="btn-accent text-base px-8 py-3.5">
                        Mulai Custom Order
                        <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
