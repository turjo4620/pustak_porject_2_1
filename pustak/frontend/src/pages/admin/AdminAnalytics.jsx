import { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, AlertTriangle } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `https://putak-porject-2-1.onrender.com/api/admin/analytics?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading analytics...</div>;

  const totalRevenue = analytics?.sales?.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0) || 0;
  const totalOrders = analytics?.sales?.reduce((sum, day) => sum + parseInt(day.order_count || 0), 0) || 0;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Analytics & Reports</h1>
      </div>

      <div className="analytics-filters">
        <div className="date-range">
          <label>From:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <label>To:</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <DollarSign size={32} />
          <h3>Total Revenue</h3>
          <p className="summary-value">à§³{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <TrendingUp size={32} />
          <h3>Total Orders</h3>
          <p className="summary-value">{totalOrders}</p>
        </div>
        <div className="summary-card">
          <Package size={32} />
          <h3>Best Sellers</h3>
          <p className="summary-value">{analytics?.bestSellers?.length || 0}</p>
        </div>
        <div className="summary-card">
          <AlertTriangle size={32} />
          <h3>Low Stock</h3>
          <p className="summary-value danger">{analytics?.lowStock?.length || 0}</p>
        </div>
      </div>

      <div className="analytics-section">
        <h2>Best Selling Books</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Total Sold</th>
              <th>Order Count</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.bestSellers?.slice(0, 10).map((book, idx) => (
              <tr key={idx}>
                <td>
                  <div className="book-info">
                    <img src={book.cover_image_url} alt={book.book_name} />
                    <span>{book.book_name}</span>
                  </div>
                </td>
                <td>{book.total_sold}</td>
                <td>{book.order_count}</td>
                <td>à§³{parseFloat(book.revenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* â”€â”€ Best Customers â”€â”€ */}
      <div className="analytics-section">
        <h2>Best Customers</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Total Orders</th>
              <th>Delivered</th>
              <th>Total Spent</th>
              <th>Last Order</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.bestCustomers?.map((c, idx) => (
              <tr key={c.user_id}>
                <td>
                  <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="customer-avatar">
                      {(c.name || c.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <strong>{c.name || 'â€”'}</strong>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{c.email}</td>
                <td><strong>{c.total_orders}</strong></td>
                <td>{c.delivered_orders}</td>
                <td>à§³{parseFloat(c.total_spent || 0).toFixed(2)}</td>
                <td style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                  {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'â€”'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-section">
        <h2>Popular Categories</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Books</th>
              <th>Total Orders</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.popularCategories?.map((cat, idx) => (
              <tr key={idx}>
                <td>{cat.category_name}</td>
                <td>{cat.book_count}</td>
                <td>{cat.order_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-section">
        <h2>Low Stock Alert</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.lowStock?.map((book, idx) => (
              <tr key={idx}>
                <td>
                  <div className="book-info">
                    <img src={book.cover_image_url} alt={book.book_name} />
                    <span>{book.book_name}</span>
                  </div>
                </td>
                <td>
                  <span className="stock-badge low">{book.total_stock}</span>
                </td>
                <td>
                  <span className="status-badge warning">Low Stock</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="analytics-section">
        <h2>Out of Stock Books</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.outOfStock?.map((book, idx) => (
              <tr key={idx}>
                <td>
                  <div className="book-info">
                    <img src={book.cover_image_url} alt={book.book_name} />
                    <span>{book.book_name}</span>
                  </div>
                </td>
                <td>
                  <span className="status-badge danger">Out of Stock</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

