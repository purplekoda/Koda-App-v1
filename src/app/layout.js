import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import StyledComponentsRegistry from '@/lib/registry'
import ThemeWrapper from '@/styles/ThemeWrapper'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata = {
  title: 'Koda',
  description: 'AI-powered meal planning, family scheduling & event planning',
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
      </body>
    </html>
  )
}
