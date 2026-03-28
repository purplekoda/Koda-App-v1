'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background};
`

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xxl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

const Logo = styled.h1`
  text-align: center;
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const Tagline = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 4px;
  display: block;
`

const InputField = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.body};
  background: ${({ theme }) => theme.colors.surface};
  transition: border-color 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }
`

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.body};
  font-weight: 500;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.coral};
  font-size: ${({ theme }) => theme.fontSizes.md};
  text-align: center;
`

const Footer = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xl};
`

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 500;
`

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanEmail = sanitizeEmail(email)
    if (!cleanEmail) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    const cleanPassword = sanitizeString(password, 128)
    if (!cleanPassword || cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (authError) {
        setError('Invalid email or password.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Card>
        <Logo>Koda</Logo>
        <Tagline>Your family planning companion</Tagline>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <InputField
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <InputField
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </SubmitButton>
        </Form>
        <Footer>
          Don&apos;t have an account? <FooterLink href="/signup">Sign up</FooterLink>
        </Footer>
      </Card>
    </Container>
  )
}
