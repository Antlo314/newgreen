import type {Metadata} from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const pressStart = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-retro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'New Greenwood (Black Wall Street Reborn)',
  description: 'Rebuild. Trade. Prosper. Honor the Legacy. A modernized 16-bit top-down RPG and tycoon game commemorating Black Wall Street.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable}`}>
      <body className="bg-[#09090b] text-gray-100 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
