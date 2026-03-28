import { redirect } from 'next/navigation'

export default async function Home() {
  // If Supabase is not configured yet, go straight to dashboard (dev mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect('/dashboard')
  }

  // Dynamic import to avoid crashing when env vars are missing
  const { getCurrentUser } = await import('@/lib/dal/auth')
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
