import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3, BookOpen, Camera, Check, ClipboardList, Eye, EyeOff,
  Pencil, ShieldCheck, UserCircle, X
} from 'lucide-react'
import '../../styles/admin.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
}

async function adminRequest(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.error || 'Request failed')
  return data
}

function EditableField({ label, value, type = 'text', placeholder, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => setDraft(value || ''), [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = async () => {
    if (draft === (value || '')) { setEditing(false); return }
    setSaving(true)
    setError('')
    try {
      await onSave(draft)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-profile-field">
      <label>{label}</label>
      {editing ? (
        <div className="admin-profile-field__edit">
          <input ref={inputRef} type={type} value={draft} placeholder={placeholder} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') save(); if (event.key === 'Escape') setEditing(false) }} />
          <button type="button" onClick={save} disabled={saving} aria-label="Save"><Check size={15} /></button>
          <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); setError('') }} aria-label="Cancel"><X size={15} /></button>
        </div>
      ) : (
        <div className="admin-profile-field__display">
          <span>{value || <em>{placeholder}</em>}</span>
          <button type="button" onClick={() => setEditing(true)} aria-label={`${label} edit`}><Pencil size={15} /></button>
        </div>
      )}
      {error && <small className="admin-profile-error">{error}</small>}
    </div>
  )
}

function PasswordSection({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (form.next.length < 8) { setError('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'); return }
    if (form.next !== form.confirm) { setError('নতুন পাসওয়ার্ড দুটি মিলছে না'); return }
    setSaving(true)
    try {
      await adminRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      })
      setForm({ current: '', next: '', confirm: '' })
      setOpen(false)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-profile-section">
      <button type="button" className="admin-profile-section__toggle" onClick={() => setOpen(current => !current)}>
        <span>পাসওয়ার্ড পরিবর্তন</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <form className="admin-password-form" onSubmit={submit}>
          {error && <p className="admin-profile-error" role="alert">{error}</p>}
          {[
            ['current', 'বর্তমান পাসওয়ার্ড'],
            ['next', 'নতুন পাসওয়ার্ড'],
            ['confirm', 'নতুন পাসওয়ার্ড নিশ্চিত করুন'],
          ].map(([key, label]) => (
            <label className="admin-password-field" key={key}>
              <span>{label}</span>
              <div>
                <input type={visible[key] ? 'text' : 'password'} value={form[key]} required onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} />
                <button type="button" onClick={() => setVisible(current => ({ ...current, [key]: !current[key] }))} aria-label="Show or hide password">
                  {visible[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
          ))}
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</button>
        </form>
      )}
    </section>
  )
}

export default function AdminAccount() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = message => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    adminRequest('/auth/me')
      .then(setProfile)
      .catch(err => setError(err.message || 'প্রোফাইল লোড করা যায়নি'))
      .finally(() => setLoading(false))
  }, [])

  const saveField = async (field, value) => {
    const updated = await adminRequest('/auth/me', { method: 'PATCH', body: JSON.stringify({ [field]: value }) })
    setProfile(current => ({ ...current, ...updated }))
    showToast('পরিবর্তন সংরক্ষিত হয়েছে ✓')
  }

  if (loading) return <div className="admin-loading">Loading account...</div>

  const name = profile?.name || 'Admin'
  const initials = name.trim().split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="admin-account-page">
      <div className="admin-header">
        <div><h1>My Account</h1><p className="admin-subtitle">Manage your admin workspace</p></div>
      </div>
      {toast && <div className="admin-profile-toast" role="status">{toast}</div>}
      {error && <div className="admin-profile-error admin-profile-error--banner" role="alert">{error}</div>}

      <section className="admin-account-card">
        <div className="admin-account-avatar-wrap">
          <div className="admin-account-avatar" aria-hidden="true">{initials}</div>
          <button type="button" className="admin-account-camera" aria-label="Change profile photo" onClick={() => showToast('প্রোফাইল ছবি আপলোড শীঘ্রই আসছে।')}><Camera size={15} /></button>
        </div>
        <div><h2 className="admin-account-name">{name}</h2><p className="admin-account-email">{profile?.email || 'Email unavailable'}</p><p className="admin-account-role"><ShieldCheck size={14} /> Administrator</p></div>
      </section>

      <section className="admin-profile-section admin-profile-details">
        <h2>ব্যক্তিগত তথ্য</h2>
        <EditableField label="নাম" value={profile?.name} placeholder="আপনার নাম" onSave={value => saveField('name', value)} />
        <EditableField label="মোবাইল নম্বর" value={profile?.phone_number} type="tel" placeholder="মোবাইল নম্বর যোগ করুন" onSave={value => saveField('phone_number', value)} />
        <div className="admin-profile-field"><label>ইমেইল</label><div className="admin-profile-field__display"><span>{profile?.email}</span><small>পরিবর্তন করা যাবে না</small></div></div>
      </section>

      <PasswordSection onSuccess={() => showToast('পাসওয়ার্ড পরিবর্তন সফল হয়েছে ✓')} />

      <div className="admin-account-links">
        <Link to="/admin/dashboard" className="admin-account-link"><BarChart3 size={20} /> Dashboard</Link>
        <Link to="/admin/books" className="admin-account-link"><BookOpen size={20} /> Manage books</Link>
        <Link to="/admin/orders" className="admin-account-link"><ClipboardList size={20} /> View orders</Link>
        <Link to="/admin/users" className="admin-account-link"><UserCircle size={20} /> Manage users</Link>
      </div>
    </div>
  )
}
