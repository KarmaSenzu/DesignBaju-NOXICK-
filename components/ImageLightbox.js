'use client';
import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, [initialIndex, isOpen]);

    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            setTransitioning(true);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setTransitioning(false);
            }, 200);
        }
    }, [currentIndex, images.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setTransitioning(true);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setTransitioning(false);
            }, 200);
        }
    }, [currentIndex]);

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
    const zoomOut = () => {
        setZoom(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) setPosition({ x: 0, y: 0 });
            return newZoom;
        });
    };

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, goNext, goPrev, onClose]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleDoubleClick = () => {
        if (zoom > 1) {
            resetZoom();
        } else {
            setZoom(2);
        }
    };

    // Touch handling
    const handleTouchStart = (e) => {
        if (zoom > 1 && e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && zoom > 1 && e.touches.length === 1) {
            e.preventDefault();
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            });
        }
    };

    const handleTouchEnd = () => setIsDragging(false);

    if (!isOpen || !images.length) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 font-medium">
                        {currentIndex + 1} / {images.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={zoomOut} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all" title="Zoom Out (-)">
                        <MagnifyingGlassMinusIcon className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-white/50 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={zoomIn} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all" title="Zoom In (+)">
                        <MagnifyingGlassPlusIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={onClose} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all" title="Close (Esc)">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Image */}
            <div
                className="relative w-full h-full flex items-center justify-center select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
                <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    className="max-w-[90vw] max-h-[80vh] object-contain pointer-events-none"
                    style={{
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                        opacity: transitioning ? 0 : 1,
                    }}
                    draggable={false}
                />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-2xl text-white/70 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goNext}
                        disabled={currentIndex === images.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-2xl text-white/70 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 rounded-2xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setTransitioning(true);
                                setZoom(1);
                                setPosition({ x: 0, y: 0 });
                                setTimeout(() => {
                                    setCurrentIndex(i);
                                    setTransitioning(false);
                                }, 200);
                            }}
                            className={`w-14 h-14 rounded-xl overflow-hidden transition-all duration-300 ${i === currentIndex
                                    ? 'ring-2 ring-purple-500 scale-110'
                                    : 'opacity-50 hover:opacity-80'
                                }`}
                        >
                            <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
