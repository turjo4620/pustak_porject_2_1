import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminPublications() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPublication, setEditingPublication] = useState(null);

  useEffect(() => {
    fetchPublications();
  }, [searchTerm]);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = searchTerm 
        ? `https://putak-porject-2-1.onrender.com/api/publications?search=${searchTerm}`
        : 'https://putak-porject-2-1.onrender.com/api/publications';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch publications');

      const data = await response.json();
      setPublications(data.data || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching publications:', error);
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (publicationId) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/publications/${publicationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete publication');

      alert('Publication deleted successfully');
      fetchPublications();
    } catch (error) {
      console.error('Error deleting publication:', error);
      alert('Failed to delete publication. It may have associated books.');
    }
  };

  const handleEdit = (publication) => {
    setEditingPublication(publication);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingPublication(null);
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Publication Management</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} /> Add New Publication
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by publication name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading publications...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Logo</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {publications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No publications found</td>
                </tr>
              ) : (
                publications.map(pub => (
                  <tr key={pub.publication_id}>
                    <td>{pub.publication_id}</td>
                    <td>
                      <img 
                        src={pub.cover_image_url || '/placeholder-publication.jpg'} 
                        alt={pub.title}
                        className="table-thumbnail"
                      />
                    </td>
                    <td><strong>{pub.title}</strong></td>
                    <td className="review-text">
                      {pub.bio || 'No description available'}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(pub)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDelete(pub.publication_id)}
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
        <PublicationModal
          publication={editingPublication}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPublications();
          }}
        />
      )}
    </div>
  );
}

function PublicationModal({ publication, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: publication?.title || '',
    bio: publication?.bio || '',
    cover_image_url: publication?.cover_image_url || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = publication 
        ? `https://putak-porject-2-1.onrender.com/api/publications/${publication.publication_id}`
        : 'https://putak-porject-2-1.onrender.com/api/publications';
      
      const response = await fetch(url, {
        method: publication ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to save publication');

      alert(`Publication ${publication ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error) {
      console.error('Error saving publication:', error);
      alert(error.message || 'Failed to save publication');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{publication ? 'Edit Publication' : 'Add New Publication'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="text"
              value={formData.cover_image_url}
              onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              placeholder="https://example.com/logo.jpg"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="6"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write publication description..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {publication ? 'Update' : 'Create'} Publication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
