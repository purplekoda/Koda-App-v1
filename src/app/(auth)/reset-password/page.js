'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

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

const SuccessMessage = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.tealLight};
  border-radius: ${({ theme }) => theme.radii.md};
`

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Supabase handles the token from the URL hash automatically
    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is valid — user can now set a new password
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError('Could not update password. Please try again or request a new reset link.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container>
        <Card>
          <Logo>Koda</Logo>
          <SuccessMessage>
            Password updated successfully! Taking you to your dashboard...
          </SuccessMessage>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card>
        <Logo>Koda</Logo>
        <Tagline>Set a new password</Tagline>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="password">New password</Label>
            <InputField
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <InputField
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </SubmitButton>
        </Form>
        <Footer>
          <FooterLink href="/login">Back to sign in</FooterLink>
        </Footer>
      </Card>
    </Container>
  )
}
