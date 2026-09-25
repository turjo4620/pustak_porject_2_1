import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Users, Package, ShoppingCart, 
  MessageSquare, BarChart3, LogOut, Menu, X,
  FileText, Tag, Ticket, RotateCcw, UserCircle, Sun, Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import '../../styles/admin.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pustak-theme') === 'dark');
  const navigate = useNavigate();
  const { signOut } = useApp();
  const token = localStorage.getItem('adminToken');

  // If no token, redirect to admin login immediately
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    signOut();                    // clears all localStorage keys + authUser state
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/books', icon: <BookOpen size={20} />, label: 'Books' },
    { path: '/admin/authors', icon: <FileText size={20} />, label: 'Authors' },
    { path: '/admin/publications', icon: <Package size={20} />, label: 'Publications' },
    { path: '/admin/categories', icon: <Tag size={20} />,    label: 'Categories' },
    { path: '/admin/coupons',    icon: <Ticket size={20} />, label: 'Coupons' },
    { path: '/admin/users',      icon: <Users size={20} />,  label: 'Users' },
    { path: '/admin/orders',     icon: <ShoppingCart size={20} />, label: 'Orders' },
    { path: '/admin/returns',    icon: <RotateCcw size={20} />, label: 'Returns' },
    { path: '/admin/reviews', icon: <MessageSquare size={20} />, label: 'Reviews' },
    { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { path: '/admin/account', icon: <UserCircle size={20} />, label: 'My Account' }
  ];

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme ? 'dark' : '');
    localStorage.setItem('pustak-theme', nextTheme ? 'dark' : 'light');
  };

  console.log('AdminLayout - Rendering layout with sidebar');

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>পুস্তক</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="admin-topbar">
          <button
            type="button"
            className="admin-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to bright mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Bright mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
