// site/app/layout.js
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'Já Caiu? — Monitor de Bans',
  description: 'Monitore jogadores da Steam e saiba quando alguém for banido no CS2, FACEIT ou Gamer Club.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Já Caiu?',
    description: 'Monitor de bans para jogadores de CS2',
    url: 'https://jacaiu.app',
    siteName: 'Já Caiu?',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
