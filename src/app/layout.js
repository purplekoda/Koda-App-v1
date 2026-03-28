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

export default function RootLayout({ children }) {
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
