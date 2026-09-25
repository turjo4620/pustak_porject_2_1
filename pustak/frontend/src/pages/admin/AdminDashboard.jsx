import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin.css';
import { 
  BookOpen, Users, Package, ShoppingCart, MessageSquare,
  TrendingUp, AlertTriangle, DollarSign
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching dashboard with token:', token ? 'exists' : 'missing');
      
      const response = await fetch('https://putak-porject-2-1.onrender.com/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Dashboard API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Dashboard API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      console.log('Dashboard data received:', data);
      setStats(data.stats);
      setRecentActivities(data.recentActivities);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Don't fail silently - set some default data
      setStats({
        totalBooks: 0,
        totalUsers: 0,
        totalAuthors: 0,
        totalOrders: 0,
        totalReviews: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        lowStockBooks: 0,
        outOfStockBooks: 0
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: 'Total Books',
      value: stats?.totalBooks || 0,
      icon: <BookOpen size={32} />,
      color: '#3b82f6',
      link: '/admin/books'
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <Users size={32} />,
      color: '#10b981',
      link: '/admin/users'
    },
    {
      title: 'Total Authors',
      value: stats?.totalAuthors || 0,
      icon: <Package size={32} />,
      color: '#8b5cf6',
      link: '/admin/authors'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: <ShoppingCart size={32} />,
      color: '#f59e0b',
      link: '/admin/orders'
    },
    {
      title: 'Total Reviews',
      value: stats?.totalReviews || 0,
      icon: <MessageSquare size={32} />,
      color: '#ec4899',
      link: '/admin/reviews'
    },
    {
      title: 'Total Revenue',
      value: `à§³${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: <DollarSign size={32} />,
      color: '#059669',
      link: '/admin/analytics'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: <AlertTriangle size={32} />,
      color: '#ef4444',
      link: '/admin/orders?status=Pending'
    },
    {
      title: 'Low Stock Books',
      value: stats?.lowStockBooks || 0,
      icon: <TrendingUp size={32} />,
      color: '#f97316',
      link: '/admin/analytics?tab=stock'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p className="admin-subtitle">Welcome to Pustak Admin Panel</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="stat-card"
            onClick={() => navigate(card.link)}
            style={{ borderLeftColor: card.color }}
          >
            <div className="stat-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section">
        <h2>Recent Activities</h2>
        <div className="activities-list">
          {recentActivities.length === 0 ? (
            <p className="no-data">No recent activities</p>
          ) : (
            recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'order' && <ShoppingCart size={20} />}
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    Order <strong>{activity.reference}</strong> - {activity.status}
                  </p>
                  <span className="activity-time">
                    {new Date(activity.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Quick Stats</h2>
        <div className="quick-stats">
          <div className="quick-stat-item">
            <h4>Out of Stock Books</h4>
            <p className="quick-stat-value danger">{stats?.outOfStockBooks || 0}</p>
          </div>
          <div className="quick-stat-item">
            <h4>Low Stock Alert</h4>
            <p className="quick-stat-value warning">{stats?.lowStockBooks || 0}</p>
          </div>
          <div className="quick-stat-item">
            <h4>Pending Orders</h4>
            <p className="quick-stat-value info">{stats?.pendingOrders || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

