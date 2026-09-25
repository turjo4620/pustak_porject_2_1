import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './AuthPage.css'

const API_BASE_URL = (() => {
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

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuthUser, authUser } = useApp()
  const [form, setForm] = useState({ email: '', password: '', userType: 'customer' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Redirect already-logged-in users away from the login page
  useEffect(() => {
    // Admin session: check adminToken, not authUser
    const userType = localStorage.getItem('pustak-user-type')
    const adminToken = localStorage.getItem('adminToken')
    if (userType === 'admin' && adminToken) {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    // Customer session
    if (authUser) {
      navigate('/account', { replace: true })
    }
  }, [authUser, navigate])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Use different endpoint based on user type
      const endpoint = form.userType === 'admin' 
        ? `${API_BASE_URL}/api/auth/admin/login`
        : `${API_BASE_URL}/api/auth/login`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })

      const data = await parseApiResponse(response)
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to sign you in right now.')
      }

      localStorage.setItem('pustak-auth-token', data.token)
      // Store user type for future reference
      localStorage.setItem('pustak-user-type', form.userType)
      
      if (form.userType === 'admin') {
        // Admin: only store adminToken, do NOT set authUser
        // This prevents admin credentials leaking into customer-facing UI
        localStorage.setItem('adminToken', data.token)
      } else {
        // Customer: store user in authUser context so customer UI shows login state
        setAuthUser(data.user)
      }
      
      setMessage({ type: 'success', text: data.message })
      
      // Navigate to appropriate page immediately
      const destination = form.userType === 'admin' ? '/admin/dashboard' : '/account'
      navigate(destination, { replace: true })
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
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-sub">Welcome back! Please login to your account</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="userType">Login As</label>
            <select 
              id="userType" 
              value={form.userType} 
              onChange={set('userType')}
              className="auth-select"
              required
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <small className="auth-hint">
              {form.userType === 'admin' 
                ? '⚠️ Admin account has access to management dashboard'
                : 'Customer account for browsing and purchasing books'}
            </small>
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
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>
        
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
