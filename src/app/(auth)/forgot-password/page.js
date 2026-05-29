'use client'

import { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { sanitizeEmail } from '@/lib/sanitize'

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

const SpamNote = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

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

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        { redirectTo: `${window.location.origin}/reset-password` }
      )

      // Always show success even if email not found — security best practice
      if (resetError && resetError.status !== 400) {
        setError('Something went wrong. Please try again.')
        return
      }

      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Container>
        <Card>
          <Logo>Koda</Logo>
          <Tagline>Check your email</Tagline>
          <SuccessMessage>
            If an account exists for {email} we sent a password reset link.
            Check your inbox and follow the link to reset your password.
          </SuccessMessage>
          <SpamNote>
            Don&apos;t see it? Check your spam folder.
          </SpamNote>
          <Footer>
            <FooterLink href="/login">Back to sign in</FooterLink>
          </Footer>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card>
        <Logo>Koda</Logo>
        <Tagline>Reset your password</Tagline>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">Email address</Label>
            <InputField
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </SubmitButton>
        </Form>
        <Footer>
          Remember your password?{' '}
          <FooterLink href="/login">Sign in</FooterLink>
        </Footer>
      </Card>
    </Container>
  )
}
