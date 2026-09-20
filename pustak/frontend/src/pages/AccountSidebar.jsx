import { NavLink, useNavigate } from 'react-router-dom'
import { User, Package, Heart, Star, LogOut, Camera, RotateCcw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './account-dashboard.css'

const NAV_ITEMS = [
  { to: '/account/info',     icon: User,       label: 'আমার তথ্য'        },
  { to: '/account/orders',   icon: Package,    label: 'অর্ডার ও ট্র্যাকিং' },
  { to: '/account/wishlist', icon: Heart,      label: 'পছন্দের তালিকা'   },
  { to: '/account/returns',  icon: RotateCcw,  label: 'রিটার্ন ও রিফান্ড' },
  { to: '/account/reviews',  icon: Star,       label: 'রিভিউ ও রেটিং'    },
]

export default function AccountSidebar() {
  const { authUser, signOut } = useApp()
  const navigate = useNavigate()

  const name     = authUser?.name     || authUser?.full_name || ''
  const email    = authUser?.email    || ''
  const phone    = authUser?.phone    || ''
  const subtitle = email || phone || ''
  const initials = name ? name.trim().charAt(0).toUpperCase() : 'U'

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <aside className="account-sidebar">
      {/* ── Identity card ── */}
      <div className="sidebar-profile-header">
        <div className="sidebar-avatar-wrap">
          <div className="avatar-circle">{initials}</div>
          <button
            className="sidebar-avatar-edit"
            aria-label="প্রোফাইল ছবি পরিবর্তন করুন"
            title="প্রোফাইল এডিট করুন"
            onClick={() => navigate('/account/info')}
          >
            <Camera size={13} />
          </button>
        </div>
        {name && (
          <div className="sidebar-profile-info">
            <h3>{name}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} strokeWidth={1.8} className="nav-item__icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Sign out ── */}
      <button className="sign-out-btn" onClick={handleSignOut}>
        <LogOut size={15} strokeWidth={1.8} />
        লগআউট
      </button>
    </aside>
  )
}
