// Theme-aware inline style helper
// Usage: const t = themeStyles(isDark);
// Then use t.cardBg, t.subtleBg, etc. in style={{}} props

export default function themeStyles(isDark) {
    return {
        // Backgrounds
        cardBg: isDark ? 'rgba(26, 26, 46, 0.5)' : '#F8F9FC',
        subtleBg: isDark ? 'rgba(108, 60, 225, 0.12)' : 'rgba(108, 60, 225, 0.04)',
        subtleBg2: isDark ? 'rgba(108, 60, 225, 0.15)' : 'rgba(108, 60, 225, 0.08)',
        subtleBg3: isDark ? 'rgba(108, 60, 225, 0.08)' : 'rgba(108, 60, 225, 0.06)',
        sectionBg: isDark ? 'rgba(108, 60, 225, 0.08)' : 'rgba(108, 60, 225, 0.04)',
        footerBg: isDark ? '#0A0A14' : '#F1F3F9',
        surfaceBg: isDark ? '#1A1A2E' : '#FFFFFF',
        pageBg: isDark ? '#0F0F1A' : '#F8F9FC',

        // Borders
        border: isDark ? '1px solid rgba(108, 60, 225, 0.15)' : '1px solid rgba(108, 60, 225, 0.08)',
        borderLight: isDark ? '1px solid rgba(108, 60, 225, 0.1)' : '1px solid rgba(108, 60, 225, 0.06)',
        borderColor: isDark ? 'rgba(108, 60, 225, 0.15)' : 'rgba(108, 60, 225, 0.08)',
        borderColorLight: isDark ? 'rgba(108, 60, 225, 0.1)' : 'rgba(108, 60, 225, 0.06)',

        // Badge / Pill backgrounds
        pillBg: isDark ? 'rgba(108, 60, 225, 0.15)' : 'rgba(108, 60, 225, 0.08)',
        pillBorder: isDark ? 'rgba(108, 60, 225, 0.3)' : 'rgba(108, 60, 225, 0.15)',
        pillColor: isDark ? '#8B5CF6' : '#6C3CE1',

        // Inactive tab/pill
        inactiveTabBg: isDark ? 'rgba(26, 26, 46, 0.5)' : 'rgba(241, 243, 249, 0.8)',
        inactiveTabBorder: isDark ? '1px solid rgba(108, 60, 225, 0.1)' : '1px solid rgba(108, 60, 225, 0.06)',

        // Section gradients
        sectionGradient: isDark
            ? 'linear-gradient(135deg, rgba(108, 60, 225, 0.12), rgba(255, 107, 107, 0.06))'
            : 'linear-gradient(135deg, rgba(108, 60, 225, 0.05), rgba(255, 107, 107, 0.03))',
        sectionGradientBorder: isDark ? 'rgba(108, 60, 225, 0.15)' : 'rgba(108, 60, 225, 0.08)',

        ctaGradient: isDark
            ? 'linear-gradient(135deg, rgba(108, 60, 225, 0.2), rgba(255, 107, 107, 0.1))'
            : 'linear-gradient(135deg, rgba(108, 60, 225, 0.08), rgba(255, 107, 107, 0.05))',
        ctaBorder: isDark ? 'rgba(108, 60, 225, 0.2)' : 'rgba(108, 60, 225, 0.1)',

        // Decoration circles
        decoCircle1: isDark
            ? 'radial-gradient(circle, rgba(108, 60, 225, 0.4), transparent)'
            : 'radial-gradient(circle, rgba(108, 60, 225, 0.3), transparent)',
        decoCircle2: isDark
            ? 'radial-gradient(circle, rgba(255, 107, 107, 0.3), transparent)'
            : 'radial-gradient(circle, rgba(255, 107, 107, 0.2), transparent)',
        decoOpacity: isDark ? 0.1 : 0.2,

        // Error/success backgrounds
        errorBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)',
        errorBorder: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.15)',
        successBg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',

        // Social/contact card
        socialBg: isDark ? 'rgba(26, 26, 46, 0.5)' : '#F8F9FC',
        socialBorder: isDark ? '1px solid rgba(108, 60, 225, 0.1)' : '1px solid rgba(108, 60, 225, 0.06)',

        // Upload area
        uploadBorder: isDark ? 'rgba(108, 60, 225, 0.2)' : 'rgba(108, 60, 225, 0.15)',
        uploadBg: isDark ? 'rgba(108, 60, 225, 0.03)' : 'rgba(108, 60, 225, 0.02)',

        // License card accent border
        accentBorder: isDark ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(255, 107, 107, 0.2)',
        accentBadgeBg: isDark ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 107, 107, 0.1)',
        accentBadgeColor: isDark ? '#FF8A8A' : '#FF6B6B',
        accentBadgeBorder: isDark ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(255, 107, 107, 0.2)',

        // File format tag
        formatBg: isDark ? 'rgba(108, 60, 225, 0.12)' : 'rgba(108, 60, 225, 0.06)',
        formatColor: isDark ? '#8B5CF6' : '#6C3CE1',
        formatBorder: isDark ? '1px solid rgba(108, 60, 225, 0.2)' : '1px solid rgba(108, 60, 225, 0.1)',

        // Price box
        priceBoxBg: isDark ? 'rgba(108, 60, 225, 0.08)' : 'rgba(108, 60, 225, 0.04)',
        priceBoxBorder: isDark ? '1px solid rgba(108, 60, 225, 0.15)' : '1px solid rgba(108, 60, 225, 0.08)',

        // Tag link
        tagBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108, 60, 225, 0.04)',
        tagBorder: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(108, 60, 225, 0.06)',

        // Category badge
        categoryBadgeBg: isDark ? 'rgba(108, 60, 225, 0.15)' : 'rgba(108, 60, 225, 0.08)',
        categoryBadgeColor: isDark ? '#8B5CF6' : '#6C3CE1',
        categoryBadgeBorder: isDark ? 'rgba(108, 60, 225, 0.3)' : 'rgba(108, 60, 225, 0.15)',

        // Payment method
        paymentActiveBg: isDark ? 'rgba(108, 60, 225, 0.1)' : 'rgba(108, 60, 225, 0.06)',
        paymentInactiveBg: isDark ? 'rgba(26, 26, 46, 0.5)' : '#FFFFFF',
        paymentInactiveBorder: isDark ? 'rgba(108, 60, 225, 0.1)' : 'rgba(108, 60, 225, 0.08)',

        // Promo applied
        promoAppliedBg: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
        promoAppliedBorder: isDark ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)',

        // Stat section gradient
        statGradient: isDark
            ? 'linear-gradient(135deg, rgba(108, 60, 225, 0.15), rgba(255, 107, 107, 0.08))'
            : 'linear-gradient(135deg, rgba(108, 60, 225, 0.06), rgba(255, 107, 107, 0.04))',
        statGradientBorder: isDark ? '1px solid rgba(108, 60, 225, 0.15)' : '1px solid rgba(108, 60, 225, 0.08)',
    };
}
