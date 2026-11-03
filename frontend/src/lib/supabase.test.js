
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSignUp, mockSignIn, mockSignOut } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
    },
  }),
}))

vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key')

import { logIn, signUp, supabase } from './supabase.js'

describe('Supabase authentication error cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects login with an incorrect password', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await logIn('student@ufl.edu', 'wrongpassword')

    expect(result.error.message).toBe('Invalid login credentials')
    expect(result.data.session).toBeNull()
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'student@ufl.edu',
      password: 'wrongpassword',
    })
  })

  it('rejects login with an unregistered email', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await logIn('unknown@ufl.edu', 'password123')

    expect(result.error).toBeTruthy()
    expect(result.data.user).toBeNull()
    expect(result.data.session).toBeNull()
  })

  it('handles duplicate registration errors', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    const result = await signUp('student@ufl.edu', 'password123')

    expect(result.error.message).toBe('User already registered')
    expect(result.data.session).toBeNull()
  })

  it('returns an authentication error without creating a session', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await logIn('student@ufl.edu', 'invalid123')

    expect(result.error).toBeTruthy()
    expect(result.data.session).toBeNull()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('does not create a user or session after failed signup', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    const result = await signUp('student@ufl.edu', 'password123')

    expect(result.data.user).toBeNull()
    expect(result.data.session).toBeNull()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('uses the mocked Supabase client', () => {
    expect(supabase).not.toBeNull()
  })
})
