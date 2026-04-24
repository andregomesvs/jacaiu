// site/app/layout.js
import { Space_Mono, Rajdhani } from 'next/font/google';
import './globals.css';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
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
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${spaceMono.variable} ${rajdhani.variable}`}>
      <body>{children}</body>
    </html>
  );
}
