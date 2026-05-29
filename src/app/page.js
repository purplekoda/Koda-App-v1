import { getCurrentUser } from '@/lib/dal/auth'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export default async function Home() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect('/dashboard')
  }
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')
  return <LandingPage />
}
