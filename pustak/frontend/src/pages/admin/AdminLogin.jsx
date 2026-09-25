import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, Mail } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', credentials.email);
      
      const response = await fetch('https://putak-porject-2-1.onrender.com/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Login response:', { user: data.user, hasToken: !!data.token });

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }
      
      // Check if user is admin using role field
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('Saving token to localStorage');
      localStorage.setItem('adminToken', data.token);
      
      // Verify token was saved
      const savedToken = localStorage.getItem('adminToken');
      console.log('Token saved successfully:', !!savedToken);
      console.log('Actual token value:', savedToken);
      
      // Add a small delay to ensure token is fully saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Navigating to /admin/dashboard');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          <BookOpen size={40} className="login-icon" />
          <h1>পুস্তক</h1>
          <p>Admin Panel — Sign in to manage your bookstore</p>
        </div>

        {error && (
          <div className="login-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} /> Email
            </label>
            <input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder="your-admin@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} /> Password
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Login with your admin account credentials</p>
        </div>
      </div>
    </div>
  );
}
