'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignupContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [appInfo, setAppInfo] = useState<{ businessName: string; email: string; contactName: string } | null>(null)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('No signup token provided')
      setLoading(false)
      return
    }

    const fetchInfo = async () => {
      const res = await fetch(`/api/wholesale/signup?token=${token}`)
      if (res.ok) {
        setAppInfo(await res.json())
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid or expired signup link')
      }
      setLoading(false)
    }
    fetchInfo()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/wholesale/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email: appInfo!.email, password }),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create account')
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-20 text-center text-neutral-500">Loading...</div>
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-4">Account Created</h1>
        <p className="text-neutral-500 mb-8">Your wholesale account is ready. You can now log in to access wholesale pricing.</p>
        <Link href="/wholesale/portal" className="bg-black text-white px-6 py-3 rounded-md font-medium text-sm">
          Go to Wholesale Portal
        </Link>
      </div>
    )
  }

  if (error && !appInfo) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
        <p className="text-neutral-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
      <p className="text-neutral-500 mb-8">Welcome, {appInfo?.contactName}! Set up your wholesale account for {appInfo?.businessName}.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={appInfo?.email || ''}
            disabled
            className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm bg-neutral-50 text-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            placeholder="Confirm your password"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

export default function WholesaleSignupPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center text-neutral-500">Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
