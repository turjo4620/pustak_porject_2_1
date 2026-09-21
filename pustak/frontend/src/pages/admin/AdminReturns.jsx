import { useEffect, useState } from 'react';
import { Check, CircleCheck, CircleX, Search, X } from 'lucide-react';
import '../../styles/admin.css';

const API_BASE = 'http://localhost:5000/api/admin';

function statusColor(status) {
  if (['approved', 'Processed'].includes(status)) return 'success';
  if (['rejected', 'Failed'].includes(status)) return 'danger';
  if (['initiated', 'Pending'].includes(status)) return 'warning';
  return 'info';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatAmount(value) {
  return value == null ? '—' : `৳${Number(value).toFixed(2)}`;
}

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refundFilter, setRefundFilter] = useState('');
  const [actionKey, setActionKey] = useState('');

  useEffect(() => {
    fetchReturns();
  }, [page, searchTerm, statusFilter, refundFilter]);

  async function fetchReturns() {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const query = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(refundFilter && { refundStatus: refundFilter }),
      });
      const response = await fetch(`${API_BASE}/returns?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to fetch returns');
      setReturns(data.returns || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  }

  async function updateReturn(returnId, action) {
    const label = action === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${label} this return request?`)) return;

    const key = `return-${returnId}`;
    try {
      setActionKey(key);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/returns/${returnId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to update return');
      await fetchReturns();
    } catch (err) {
      setError(err.message || 'Failed to update return');
    } finally {
      setActionKey('');
    }
  }

  async function updateRefund(refundId, status) {
    if (!window.confirm(`Mark this refund as ${status}?`)) return;

    const key = `refund-${refundId}`;
    try {
      setActionKey(key);
      setError('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/returns/refunds/${refundId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to update refund');
      await fetchReturns();
    } catch (err) {
      setError(err.message || 'Failed to update refund');
    } finally {
      setActionKey('');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Returns & Refunds</h1>
          <p className="admin-subtitle">Review customer returns and finalize approved refunds.</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search book, order number, customer..."
            value={searchTerm}
            onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
          />
        </div>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
          <option value="">All return statuses</option>
          <option value="initiated">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={refundFilter} onChange={(event) => { setRefundFilter(event.target.value); setPage(1); }}>
          <option value="">All refund statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processed">Processed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading returns...</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Return</th>
                  <th>Refund</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr><td colSpan="7">No return requests found.</td></tr>
                ) : returns.map((item) => {
                  const returnActionKey = `return-${item.return_id}`;
                  const refundActionKey = `refund-${item.refund_id}`;
                  const isUpdatingReturn = actionKey === returnActionKey;
                  const isUpdatingRefund = actionKey === refundActionKey;

                  return (
                    <tr key={item.return_id}>
                      <td>
                        <div className="item-info">
                          {item.cover_image_url && <img src={item.cover_image_url} alt="" className="table-thumbnail" />}
                          <span className="book-title" title={item.book_name}>{item.book_name}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{item.order_number}</strong>
                        <div><span className={`status-badge ${statusColor(item.order_status)}`}>{item.order_status}</span></div>
                      </td>
                      <td>
                        <div>{item.user_name}</div>
                        <small style={{ color: '#888' }}>{item.user_email}</small>
                      </td>
                      <td>
                        <span className={`status-badge ${statusColor(item.return_status)}`}>{item.return_status}</span>
                        <div className="admin-table-note" title={item.reason}>{item.reason || '—'}</div>
                      </td>
                      <td>
                        {item.refund_id ? (
                          <>
                            <strong>{formatAmount(item.refund_amount)}</strong>
                            <div><span className={`status-badge ${statusColor(item.refund_status)}`}>{item.refund_status}</span></div>
                          </>
                        ) : '—'}
                      </td>
                      <td>{formatDate(item.request_date)}</td>
                      <td className="actions-cell">
                        {item.return_status === 'initiated' && (
                          <>
                            <button
                              className="btn-icon success"
                              onClick={() => updateReturn(item.return_id, 'approve')}
                              disabled={isUpdatingReturn || Boolean(actionKey)}
                              title="Approve return"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              className="btn-icon danger"
                              onClick={() => updateReturn(item.return_id, 'reject')}
                              disabled={isUpdatingReturn || Boolean(actionKey)}
                              title="Reject return"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {item.refund_status === 'Pending' && (
                          <>
                            <button
                              className="btn-icon success"
                              onClick={() => updateRefund(item.refund_id, 'Processed')}
                              disabled={isUpdatingRefund || Boolean(actionKey)}
                              title="Mark refund processed"
                            >
                              <CircleCheck size={18} />
                            </button>
                            <button
                              className="btn-icon danger"
                              onClick={() => updateRefund(item.refund_id, 'Failed')}
                              disabled={isUpdatingRefund || Boolean(actionKey)}
                              title="Mark refund failed"
                            >
                              <CircleX size={18} />
                            </button>
                          </>
                        )}
                        {item.return_status !== 'initiated' && item.refund_status !== 'Pending' && '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
