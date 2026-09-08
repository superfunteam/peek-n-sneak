import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://peek-n-sneak.superfun.games'),
  applicationName: "Peek 'n Sneak",
  title: "Peek 'n Sneak — Ready or not.",
  description:
    'The wonderfully weird hide-and-seek classic, rewound for your phone. Play a sneaky bot or invite a friend to Houston, Dallas, and Merrimac.',
  alternates: { canonical: '/' },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#d2ed79' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Peek 'n Sneak",
    statusBarStyle: 'black',
  },
  other: { 'mobile-web-app-capable': 'yes' },
  openGraph: {
    title: "Peek 'n Sneak",
    description: 'Ready or not, here I come. Hide-and-seek, rewound.',
    type: 'website',
    siteName: "Peek 'n Sneak",
    locale: 'en_US',
    url: 'https://peek-n-sneak.superfun.games',
    images: [
      {
        url: 'https://peek-n-sneak.superfun.games/og.png',
        type: 'image/png',
        width: 1731,
        height: 909,
        alt: "Peek 'n Sneak — Ready or not, here I come.",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://peek-n-sneak.superfun.games/og.png',
        alt: "Peek 'n Sneak — Ready or not, here I come.",
      },
    ],
    title: "Peek 'n Sneak",
    description: 'Ready or not, here I come. Hide-and-seek, rewound.',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#181a17',
  colorScheme: 'dark',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
