import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = searchTerm 
        ? `https://putak-porject-2-1.onrender.com/api/categories?search=${searchTerm}`
        : 'https://putak-porject-2-1.onrender.com/api/categories';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data.data || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete category');

      alert('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. It may have associated books.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Category Management</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} /> Add New Category
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by category name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading categories...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="no-data">No categories found</td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category.category_id}>
                    <td>{category.category_id}</td>
                    <td><strong>{category.category_name}</strong></td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(category)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDelete(category.category_id)}
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
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    category_name: category?.category_name || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = category 
        ? `https://putak-porject-2-1.onrender.com/api/categories/${category.category_id}`
        : 'https://putak-porject-2-1.onrender.com/api/categories';
      
      const response = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save category');

      alert(`Category ${category ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{category ? 'Edit Category' : 'Add New Category'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Category Name *</label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              placeholder="e.g., Fiction, Science, History"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {category ? 'Update' : 'Create'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
