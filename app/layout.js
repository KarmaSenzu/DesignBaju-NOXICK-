import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'NOXICK - Streetwear Design Studio',
  description: 'Noxick Streetwear Design Studio — Platform marketplace desain streetwear digital terbaik. Beli desain kaos, hoodie, celana, dan outfit set lengkap. Atau pesan desain custom sesuai kebutuhan Anda.',
  keywords: 'noxick, streetwear, desain, marketplace, baju, celana, hoodie, outfit, digital design, custom design',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
