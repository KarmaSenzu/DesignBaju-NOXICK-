'use client';
import { useState } from 'react';
import { faqItems } from '@/lib/mockData';
import Link from 'next/link';
import { ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState(faqItems[0].category);
    const [openIndex, setOpenIndex] = useState(null);

    const currentFaq = faqItems.find(f => f.category === activeCategory);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div>
            {/* Header */}
            <section className="hero-gradient">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium" style={{ background: 'rgba(108, 60, 225, 0.08)', border: '1px solid rgba(108, 60, 225, 0.15)', color: '#6C3CE1' }}>
                        <QuestionMarkCircleIcon className="w-4 h-4" />
                        FAQ
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
                        Pertanyaan yang <span className="gradient-text">Sering Ditanyakan</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Temukan jawaban untuk pertanyaan umum tentang produk, lisensi, dan layanan kami.
                    </p>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {faqItems.map(faq => (
                        <button
                            key={faq.category}
                            onClick={() => { setActiveCategory(faq.category); setOpenIndex(null); }}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCategory === faq.category
                                ? 'text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                            style={activeCategory === faq.category
                                ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }
                                : { background: 'rgba(241, 243, 249, 0.8)', border: '1px solid rgba(108, 60, 225, 0.06)' }
                            }
                        >
                            {faq.category}
                        </button>
                    ))}
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-3">
                    {currentFaq?.items.map((item, index) => (
                        <div key={index} className="glass-card overflow-hidden">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-purple-50/50 transition-colors"
                            >
                                <span className="text-base font-semibold text-slate-800 pr-4">{item.q}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-purple-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                                <div className="px-5 pb-5">
                                    <p className="text-sm text-slate-500 leading-relaxed" style={{ borderTop: '1px solid rgba(108, 60, 225, 0.06)', paddingTop: '16px' }}>
                                        {item.a}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Still have questions */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="glass-card p-10 text-center">
                    <div className="text-5xl mb-4">🤔</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Masih Ada Pertanyaan?</h2>
                    <p className="text-slate-500 mb-6">Jangan ragu untuk menghubungi kami. Tim kami siap membantu!</p>
                    <div className="flex items-center justify-center gap-4">
                        <Link href="/contact" className="btn-primary">Hubungi Kami</Link>
                        <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                            WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
