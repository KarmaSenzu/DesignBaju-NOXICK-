'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('designbaju_wishlist');
        if (saved) {
            setWishlistItems(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('designbaju_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToWishlist = (design) => {
        setWishlistItems(prev => {
            const exists = prev.find(item => item.id === design.id);
            if (exists) return prev;
            return [...prev, { id: design.id, title: design.title, price: design.price, preview_image: design.preview_image, category: design.category, rating: design.rating }];
        });
    };

    const removeFromWishlist = (designId) => {
        setWishlistItems(prev => prev.filter(item => item.id !== designId));
    };

    const toggleWishlist = (design) => {
        if (isInWishlist(design.id)) {
            removeFromWishlist(design.id);
        } else {
            addToWishlist(design);
        }
    };

    const isInWishlist = (designId) => {
        return wishlistItems.some(item => item.id === designId);
    };

    const totalWishlist = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{
            wishlistItems, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, totalWishlist,
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
}
