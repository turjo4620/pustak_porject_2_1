import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, ClipboardList, UserCircle } from 'lucide-react'
import '../../styles/admin.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

export default function AdminAccount() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : null)
      .then(data => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="admin-loading">Loading account...</div>

  const name = profile?.name || 'Admin'
  const initials = name.trim().slice(0, 1).toUpperCase()

  return (
    <div className="admin-account-page">
      <div className="admin-header">
        <div>
          <h1>My Account</h1>
          <p className="admin-subtitle">Manage your admin workspace</p>
        </div>
      </div>

      <section className="admin-account-card">
        <div className="admin-account-avatar" aria-hidden="true">{initials}</div>
        <div>
          <h2 className="admin-account-name">{name}</h2>
          <p className="admin-account-email">{profile?.email || 'Email unavailable'}</p>
          <p className="admin-account-role">Administrator</p>
        </div>
      </section>

      <div className="admin-account-links">
        <Link to="/admin/dashboard" className="admin-account-link"><BarChart3 size={20} /> Dashboard</Link>
        <Link to="/admin/books" className="admin-account-link"><BookOpen size={20} /> Manage books</Link>
        <Link to="/admin/orders" className="admin-account-link"><ClipboardList size={20} /> View orders</Link>
        <Link to="/admin/users" className="admin-account-link"><UserCircle size={20} /> Manage users</Link>
      </div>
    </div>
  )
}
