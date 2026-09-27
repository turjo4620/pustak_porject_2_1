import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './AuthPage.css'

const API_BASE_URL = (() => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }

  const configuredUrl = (import.meta.env.VITE_API_URL || '').trim()
  const normalizedUrl = configuredUrl.replace(/\/+$/, '').replace(/\/api$/, '')
  return normalizedUrl || 'https://putak-porject-2-1.onrender.com'
})()

async function parseApiResponse(response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { message: 'The authentication service returned an unexpected response.' }
  }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          password: form.password
        })
      })

      const data = await parseApiResponse(response)
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to create your account right now.')
      }

      navigate('/login', {
        replace: true,
        state: {
          message: 'Account created successfully. Please log in to continue.',
          userType: 'customer',
          email: form.email
        }
      })
    } catch (error) {
      const friendlyMessage = error.message.includes('Unexpected token')
        ? 'The authentication service is unavailable. Make sure the backend is running.'
        : error.message
      setMessage({ type: 'error', text: friendlyMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">পুস্তক</Link>
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-sub">Create a new account</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Your name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>
          {message.text ? (
            <p className={`auth-message ${message.type}`} role="status" aria-live="polite">
              {message.text}
            </p>
          ) : null}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
