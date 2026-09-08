import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: "Peek 'n Sneak — Ready or not.",
  description:
    'The wonderfully weird hide-and-seek classic, rewound for your phone. Play a sneaky bot or invite a friend to Houston, Dallas, and Merrimac.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: "Peek 'n Sneak",
    description: 'Ready or not, here I come. Hide-and-seek, rewound.',
    type: 'website',
    url: 'https://peek-n-sneak.clarklab.chatgpt.site',
    images: [
      {
        url: 'https://peek-n-sneak.clarklab.chatgpt.site/og.png',
        width: 1731,
        height: 909,
        alt: "Peek 'n Sneak — Ready or not, here I come.",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://peek-n-sneak.clarklab.chatgpt.site/og.png'],
    title: "Peek 'n Sneak",
    description: 'Ready or not, here I come. Hide-and-seek, rewound.',
  },
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
