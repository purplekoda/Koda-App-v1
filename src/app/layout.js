import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import StyledComponentsRegistry from '@/lib/registry';
import ThemeWrapper from '@/styles/ThemeWrapper';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata = {
  title: 'Koda',
  description: 'Koda-powered meal planning, family scheduling & event planning',
};
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  themeColor: '#1D9E75',
}

export default async function RootLayout({ children }) {
  // Read the per-request nonce set by the proxy in the x-nonce header.
  // Next.js extracts this nonce from the CSP header and stamps it on
  // framework-emitted script tags automatically; we surface it here so
  // any <Script> components added to the layout can receive it as well.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StyledComponentsRegistry>
          <ThemeWrapper>{children}</ThemeWrapper>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
