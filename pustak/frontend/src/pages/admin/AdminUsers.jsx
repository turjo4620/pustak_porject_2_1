import { useState, useEffect } from 'react';
import { Search, Eye, Ban, CheckCircle } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/users?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setSelectedUser(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update user status');

      alert('User status updated successfully');
      fetchUsers();
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Management</h1>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Reviews</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone_number || 'N/A'}</td>
                    <td>{user.total_orders}</td>
                    <td>{user.total_reviews}</td>
                    <td>
                      <span className={`status-badge ${user.status === 'Active' ? 'success' : 'danger'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString() 
                        : 'Never'}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon" 
                        onClick={() => fetchUserDetails(user.user_id)}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className={`btn-icon ${user.status === 'Active' ? 'danger' : 'success'}`}
                        onClick={() => updateUserStatus(user.user_id, user.status === 'Active' ? 'Blocked' : 'Active')}
                        title={user.status === 'Active' ? 'Block User' : 'Activate User'}
                      >
                        {user.status === 'Active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>

            <div className="user-details">
              <div className="details-section">
                <h3>Personal Information</h3>
                <p><strong>User ID:</strong> {selectedUser.user_id}</p>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phone_number || 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedUser.status === 'Active' ? 'success' : 'danger'}`}>
                    {selectedUser.status}
                  </span>
                </p>
              </div>

              <div className="details-section">
                <h3>Activity Statistics</h3>
                <p><strong>Total Orders:</strong> {selectedUser.total_orders}</p>
                <p><strong>Total Reviews:</strong> {selectedUser.total_reviews}</p>
                <p><strong>Total Spent:</strong> à§³{parseFloat(selectedUser.total_spent || 0).toFixed(2)}</p>
                <p><strong>Last Login:</strong> {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}</p>
              </div>

              <div className="details-section">
                <h3>Actions</h3>
                <button 
                  className={`btn ${selectedUser.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => updateUserStatus(selectedUser.user_id, selectedUser.status === 'Active' ? 'Blocked' : 'Active')}
                >
                  {selectedUser.status === 'Active' ? 'Block User' : 'Activate User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

