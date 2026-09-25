import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminAuthors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);

  useEffect(() => {
    fetchAuthors();
  }, [searchTerm]);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = searchTerm 
        ? `https://putak-porject-2-1.onrender.com/api/authors?search=${searchTerm}`
        : 'https://putak-porject-2-1.onrender.com/api/authors';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch authors');

      const data = await response.json();
      setAuthors(data.data || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching authors:', error);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (authorId) => {
    if (!confirm('Are you sure you want to delete this author?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/authors/${authorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete author');

      alert('Author deleted successfully');
      fetchAuthors();
    } catch (error) {
      console.error('Error deleting author:', error);
      alert('Failed to delete author. They may have associated books.');
    }
  };

  const handleEdit = (author) => {
    setEditingAuthor(author);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingAuthor(null);
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Author Management</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} /> Add New Author
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by author name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading authors...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Biography</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No authors found</td>
                </tr>
              ) : (
                authors.map(author => (
                  <tr key={author.author_id}>
                    <td>{author.author_id}</td>
                    <td>
                      <img 
                        src={author.photo_url || '/placeholder-author.jpg'} 
                        alt={author.name}
                        className="table-thumbnail"
                        style={{ borderRadius: '50%' }}
                      />
                    </td>
                    <td><strong>{author.name}</strong></td>
                    <td className="review-text">
                      {author.bio || 'No biography available'}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(author)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDelete(author.author_id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AuthorModal
          author={editingAuthor}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchAuthors();
          }}
        />
      )}
    </div>
  );
}

function AuthorModal({ author, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: author?.name || '',
    bio: author?.bio || '',
    photo_url: author?.photo_url || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = author 
        ? `https://putak-porject-2-1.onrender.com/api/authors/${author.author_id}`
        : 'https://putak-porject-2-1.onrender.com/api/authors';
      
      const response = await fetch(url, {
        method: author ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save author');

      alert(`Author ${author ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error) {
      console.error('Error saving author:', error);
      alert('Failed to save author');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{author ? 'Edit Author' : 'Add New Author'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Photo URL</label>
            <input
              type="text"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="form-group">
            <label>Biography</label>
            <textarea
              rows="6"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write author biography..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {author ? 'Update' : 'Create'} Author
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

