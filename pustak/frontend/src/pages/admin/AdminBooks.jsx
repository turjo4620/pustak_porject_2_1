import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';
import '../../styles/admin.css';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    availability: '',
    category_id: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publications, setPublications] = useState([]);

  useEffect(() => {
    fetchBooks();
    fetchMetadata();
  }, [page, searchTerm, filters]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...filters
      });

      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/books?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch books');

      const data = await response.json();
      setBooks(data.books);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [categoriesRes, authorsRes, publicationsRes] = await Promise.all([
        fetch('https://putak-porject-2-1.onrender.com/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://putak-porject-2-1.onrender.com/api/authors', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://putak-porject-2-1.onrender.com/api/publications', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);


      const authorsData = await authorsRes.json();
      const publicationsData = await publicationsRes.json();
      const categoriesData = await categoriesRes.json();

      setCategories(categoriesData.data || (Array.isArray(categoriesData) ? categoriesData : []));
      setAuthors(authorsData.data || (Array.isArray(authorsData) ? authorsData : []));
      setPublications(publicationsData.data || (Array.isArray(publicationsData) ? publicationsData : []));

    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://putak-porject-2-1.onrender.com/api/admin/books/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to delete book');
      }

      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert(error.message || 'Failed to delete book');
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingBook(null);
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Book Management</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} /> Add New Book
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by title or ISBN..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <select 
          value={filters.availability} 
          onChange={(e) => handleFilterChange('availability', e.target.value)}
        >
          <option value="">All Availability</option>
          <option value="In Stock">In Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Pre-Order">Pre-Order</option>
        </select>

        <select 
          value={filters.category_id} 
          onChange={(e) => handleFilterChange('category_id', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading books...</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>ISBN</th>
                  <th>Authors</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id}>
                    <td>{book.id}</td>
                    <td>
                      <img 
                        src={book.cover_image_url || '/placeholder-book.jpg'} 
                        alt={book.book_name}
                        className="table-thumbnail"
                      />
                    </td>
                    <td className="book-title">{book.book_name}</td>
                    <td>{book.isbn || 'N/A'}</td>
                    <td>
                      {Array.isArray(book.authors) 
                        ? book.authors.map(a => a.name).join(', ') 
                        : 'N/A'}
                    </td>
                    <td>
                      {book.discount_percentage > 0 ? (
                        <>
                          <span className="price-original">৳{book.price}</span>
                          <span className="price-discount">
                            ৳{Math.round(book.price * (1 - book.discount_percentage / 100))}
                          </span>
                          <span style={{ fontSize: '11px', color: '#16a34a', marginLeft: 4 }}>
                            ({book.discount_percentage}% ছাড়)
                          </span>
                        </>
                      ) : (
                        `৳${book.price}`
                      )}
                    </td>
                    <td>
                      <span className={`stock-badge ${book.total_stock < 10 ? 'low' : ''}`}>
                        {book.total_stock}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${book.availability?.toLowerCase().replace(' ', '-')}`}>
                        {book.availability}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(book)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDelete(book.id)}
                        title="Delete"
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
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {showModal && (
        <BookModal
          book={editingBook}
          categories={categories}
          authors={authors}
          publications={publications}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchBooks();
          }}
        />
      )}
    </div>
  );
}

// ── Floating tooltip portal rendered at document.body level ────────────────
function FloatingTooltip({ text, anchorRect }) {
  if (!text || !anchorRect) return null;

  // Position above the card, centred
  const style = {
    position:  'fixed',
    left:      anchorRect.left + anchorRect.width / 2,
    top:       anchorRect.top - 8,
    transform: 'translate(-50%, -100%)',
    zIndex:    9999,
    maxWidth:  220,
    background:     '#1a1a1a',
    color:          '#f0ece4',
    borderRadius:   8,
    padding:        '10px 13px',
    fontSize:       '0.78rem',
    lineHeight:     1.55,
    pointerEvents:  'none',
    boxShadow:      '0 8px 24px rgba(0,0,0,0.35)',
    wordBreak:      'break-word',
  };

  // Keep within viewport horizontally
  const vw = window.innerWidth;
  let left = anchorRect.left + anchorRect.width / 2;
  if (left - 110 < 8)  left = 118;
  if (left + 110 > vw - 8) left = vw - 118;
  style.left = left;

  return (
    <div style={style}>
      {text}
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: 6,
        borderStyle: 'solid',
        borderColor: '#1a1a1a transparent transparent transparent',
      }} />
    </div>
  );
}

// ── Generic picker (works for both authors and publications) ────────────────
function EntityPicker({
  items,          // array of objects
  selectedIds,    // number[]
  onToggle,       // (id: number) => void
  idKey,          // e.g. 'author_id' | 'publication_id'
  nameKey,        // e.g. 'name' | 'title'
  photoKey,       // e.g. 'photo_url' | 'cover_image_url'
  bioKey,         // e.g. 'bio'
  searchPlaceholder,
}) {
  const [search,      setSearch]      = useState('');
  const [tooltip,     setTooltip]     = useState(null);  // { text, rect }
  const leaveTimer = useRef(null);

  const filtered = items.filter(item =>
    (item[nameKey] || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleMouseEnter = useCallback((e, item) => {
    const bio = item[bioKey];
    if (!bio) return;
    clearTimeout(leaveTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ text: bio.slice(0, 160) + (bio.length > 160 ? '…' : ''), rect });
  }, [bioKey]);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setTooltip(null), 120);
  }, []);

  return (
    <>
      {/* Portal tooltip */}
      {tooltip && (
        <FloatingTooltip text={tooltip.text} anchorRect={tooltip.rect} />
      )}

      <div className="author-picker">
        <input
          type="text"
          className="author-picker__search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="author-picker__grid">
          {filtered.map(item => {
            const id       = item[idKey];
            const name     = item[nameKey] || '';
            const photo    = item[photoKey];
            const selected = selectedIds.includes(id);

            return (
              <button
                key={id}
                type="button"
                className={`author-card ${selected ? 'author-card--selected' : ''}`}
                onClick={() => onToggle(id)}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
                aria-pressed={selected}
              >
                <div className="author-card__photo-wrap">
                  {photo
                    ? <img src={photo} alt={name} className="author-card__photo" />
                    : <div className="author-card__photo-fallback">
                        {name.charAt(0).toUpperCase()}
                      </div>
                  }
                  {selected && (
                    <span className="author-card__check" aria-hidden="true">✓</span>
                  )}
                </div>
                <span className="author-card__name">{name}</span>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="author-picker__empty">কিছু পাওয়া যায়নি।</p>
          )}
        </div>
      </div>
    </>
  );
}

// Keep AuthorPicker as a thin wrapper for backwards compat
function AuthorPicker({ authors, selectedIds, onToggle }) {
  return (
    <EntityPicker
      items={authors}
      selectedIds={selectedIds}
      onToggle={onToggle}
      idKey="author_id"
      nameKey="name"
      photoKey="photo_url"
      bioKey="bio"
      searchPlaceholder="লেখক খুঁজুন..."
    />
  );
}

// Publication picker wrapper
function PublicationPicker({ publications, selectedIds, onToggle }) {
  return (
    <EntityPicker
      items={publications}
      selectedIds={selectedIds}
      onToggle={onToggle}
      idKey="publication_id"
      nameKey="title"
      photoKey="cover_image_url"
      bioKey="bio"
      searchPlaceholder="প্রকাশনী খুঁজুন..."
    />
  );
}

function BookModal({ book, categories, authors, publications, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    book_name: book?.book_name || '',
    isbn: book?.isbn || '',
    cover_image_url: book?.cover_image_url || '',
    language: book?.language || 'Bengali',
    num_pages: book?.num_pages || '',
    edition: book?.edition || '',
    price: book?.price || '',
    discount_percentage: book?.discount_percentage || 0,
    availability: book?.availability || 'In Stock',
    description: book?.description || '',
    author_ids: book?.authors?.map(a => a.author_id) || [],
    publication_ids: book?.publications?.map(p => p.publication_id) || [],
    category_ids: book?.categories?.map(c => c.category_id) || [],
    stock_quantity: book?.total_stock || 0
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = book 
        ? `https://putak-porject-2-1.onrender.com/api/admin/books/${book.id}`
        : 'https://putak-porject-2-1.onrender.com/api/admin/books';
      
      const response = await fetch(url, {
        method: book ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to save book');

      onSuccess();
    } catch (error) {
      console.error('Error saving book:', error);
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    const numValue = parseInt(value);
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(numValue)
        ? prev[field].filter(id => id !== numValue)
        : [...prev[field], numValue]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{book ? 'Edit Book' : 'Add New Book'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            {book && (
              <div className="form-group">
                <label>Book ID</label>
                <input type="number" value={book.id} disabled />
              </div>
            )}

            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => handleChange('isbn', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.book_name}
              onChange={(e) => handleChange('book_name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Cover Image URL</label>
            <input
              type="text"
              value={formData.cover_image_url}
              onChange={(e) => handleChange('cover_image_url', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Language</label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Pages</label>
              <input
                type="number"
                value={formData.num_pages}
                onChange={(e) => handleChange('num_pages', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => handleChange('edition', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Discount % <small style={{color:'#888'}}>(0–100, e.g. 18 for 18% off)</small></label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.discount_percentage}
                onChange={(e) => handleChange('discount_percentage', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              {formData.price && formData.discount_percentage > 0 && (
                <small style={{ color: '#16a34a' }}>
                  Discounted price: ৳{Math.round(formData.price * (1 - formData.discount_percentage / 100))}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange('stock_quantity', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Availability <small style={{color:'#888'}}>(auto-set by stock; override only for Pre-Order)</small></label>
            <select
              value={formData.availability}
              onChange={(e) => handleChange('availability', e.target.value)}
            >
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Pre-Order">Pre-Order</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              Authors
              {formData.author_ids.length > 0 && (
                <span className="author-picker__count">
                  {formData.author_ids.length} selected
                </span>
              )}
            </label>
            <AuthorPicker
              authors={authors}
              selectedIds={formData.author_ids}
              onToggle={(id) => handleMultiSelect('author_ids', id)}
            />
          </div>

          <div className="form-group">
            <label>
              Publications
              {formData.publication_ids.length > 0 && (
                <span className="author-picker__count">
                  {formData.publication_ids.length} selected
                </span>
              )}
            </label>
            <PublicationPicker
              publications={publications}
              selectedIds={formData.publication_ids}
              onToggle={(id) => handleMultiSelect('publication_ids', id)}
            />
          </div>

          <div className="form-group">
            <label>Categories</label>
            <div className="checkbox-group">
              {categories.slice(0, 15).map(cat => (
                <label key={cat.category_id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.category_ids.includes(cat.category_id)}
                    onChange={() => handleMultiSelect('category_ids', cat.category_id)}
                  />
                  {cat.category_name}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (book ? 'Update' : 'Create') + ' Book'}
            </button>
          </div>
          {submitError && <p style={{ color: '#dc2626', marginTop: 8, fontSize: '0.88rem' }}>{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
