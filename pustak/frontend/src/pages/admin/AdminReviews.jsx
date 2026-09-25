import { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, FileText, X } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/reviews?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (reviewId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/reviews/${reviewId}/visibility`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to toggle visibility');

      fetchReviews();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update review visibility');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete review');

      alert('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Review Management</h1>
      </div>

      {loading ? (
        <div className="admin-loading">Loading reviews...</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Book</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No reviews found</td>
                  </tr>
                ) : reviews.map(review => (
                  <tr key={review.review_id} className={review.is_hidden ? 'hidden-row' : ''}>
                    <td>{review.review_id}</td>
                    <td>{review.book_name}</td>
                    <td>{review.user_name}</td>
                    <td>
                      <span className="rating-stars">{renderStars(review.rating)}</span>
                    </td>
                    <td className="review-text">{review.review_text || 'No text'}</td>
                    <td>{review.review_date
                      ? new Date(review.review_date).toLocaleDateString()
                      : '—'}</td>
                    <td>
                      <span className={`status-badge ${review.is_hidden ? 'danger' : 'success'}`}>
                        {review.is_hidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => setSelectedReview(review)}
                        title="View Details"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => toggleVisibility(review.review_id)}
                        title={review.is_hidden ? 'Show Review' : 'Hide Review'}
                      >
                        {review.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => deleteReview(review.review_id)}
                        title="Delete Review"
                      >
                        <Trash2 size={18} />
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

      {selectedReview && (
        <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedReview(null)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <p><strong>Review ID:</strong> {selectedReview.review_id}</p>
              <p><strong>Book:</strong> {selectedReview.book_name || '—'}</p>
              <p><strong>User:</strong> {selectedReview.user_name || '—'}</p>
              <p>
                <strong>Rating:</strong>{' '}
                <span className="rating-stars">{renderStars(Number(selectedReview.rating) || 0)}</span>
              </p>
              <p>
                <strong>Date:</strong>{' '}
                {selectedReview.review_date
                  ? new Date(selectedReview.review_date).toLocaleString()
                  : '—'}
              </p>
              <p>
                <strong>Visibility:</strong>{' '}
                {selectedReview.is_hidden ? 'Hidden' : 'Visible'}
              </p>
              <div>
                <strong>Review:</strong>
                <p className="review-details-text">{selectedReview.review_text || 'No text'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
