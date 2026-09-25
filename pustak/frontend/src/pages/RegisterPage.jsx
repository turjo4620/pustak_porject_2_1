import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
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
  const { setAuthUser } = useApp()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    accountType: 'customer' // default to customer
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
          password: form.password,
          is_admin: form.accountType === 'admin' // convert to boolean
        })
      })

      const data = await parseApiResponse(response)
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to create your account right now.')
      }

      localStorage.setItem('pustak-auth-token', data.token)
      localStorage.setItem('pustak-user-type', form.accountType)

      if (form.accountType === 'admin') {
        localStorage.setItem('adminToken', data.token)
      } else {
        setAuthUser(data.user)
      }

      navigate('/', { replace: true })
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
        <h1 className="auth-title">নিবন্ধন করুন</h1>
        <p className="auth-sub">নতুন অ্যাকাউন্ট তৈরি করুন</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="accountType">অ্যাকাউন্ট ধরন</label>
            <select 
              id="accountType" 
              value={form.accountType} 
              onChange={set('accountType')}
              className="auth-select"
              required
            >
              <option value="customer">গ্রাহক (Customer)</option>
              <option value="admin">অ্যাডমিন (Admin)</option>
            </select>
            <small className="auth-hint">
              {form.accountType === 'admin' 
                ? '⚠️ অ্যাডমিন অ্যাকাউন্ট বই, অর্ডার এবং ব্যবহারকারী পরিচালনা করতে পারে'
                : 'গ্রাহক অ্যাকাউন্ট বই ব্রাউজ এবং ক্রয় করতে পারে'}
            </small>
          </div>
          <div className="auth-field">
            <label htmlFor="name">পুরো নাম</label>
            <input id="name" type="text" placeholder="আপনার নাম" value={form.name} onChange={set('name')} required />
          </div>
          <div className="auth-field">
            <label htmlFor="email">ইমেইল</label>
            <input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">পাসওয়ার্ড</label>
            <input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>
          {message.text ? (
            <p className={`auth-message ${message.type}`} role="status" aria-live="polite">
              {message.text}
            </p>
          ) : null}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে…' : 'নিবন্ধন করুন'}
          </button>
        </form>
        <p className="auth-switch">
          ইতোমধ্যে অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link>
        </p>
      </div>
    </div>
  )
}
