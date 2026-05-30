import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import StyledComponentsRegistry from '@/lib/registry'
import ThemeWrapper from '@/styles/ThemeWrapper'
import PWARegister from '@/components/PWARegister'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata = {
  title: 'Koda',
  description: 'Koda-powered meal planning, family scheduling & event planning',
  applicationName: 'Koda',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Koda' },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport = {
  themeColor: '#1D9E75',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }) {
  // Read the per-request nonce set by the proxy in the x-nonce header.
  // Next.js extracts this nonce from the CSP header and stamps it on
  // framework-emitted script tags automatically; we surface it here so
  // any <Script> components added to the layout can receive it as well.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StyledComponentsRegistry>
          <ThemeWrapper>{children}</ThemeWrapper>
        </StyledComponentsRegistry>
        <PWARegister />
      </body>
    </html>
  )
}
