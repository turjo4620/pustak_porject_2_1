import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Copy, Check, AlertCircle } from 'lucide-react';
import '../../styles/admin.css';

// â”€â”€ API helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BASE = 'https://putak-porject-2-1.onrender.com/api';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
  return body;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/**
 * Derive a display status from the real DB columns.
 * 'status' column holds 'Active' or 'Inactive'.
 * We further compute 'expired' and 'scheduled' from dates.
 */
function derivedStatus(c) {
  const now = new Date();
  if (c.status !== 'Active') return 'inactive';
  if (c.end_date && new Date(c.end_date) < now) return 'expired';
  if (c.start_date && new Date(c.start_date) > now) return 'scheduled';
  return 'active';
}

function fmtDate(iso) {
  if (!iso) return 'â€”';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function discountLabel(c) {
  if (!c) return 'â€”';
  if ((c.discount_type || '').toLowerCase() === 'percentage') {
    return `${c.discount_value}%`;
  }
  return `à§³${c.discount_value}`;
}

const STATUS_META = {
  active:    { label: 'Active',    badge: 'coupon-badge coupon-badge--active' },
  inactive:  { label: 'Inactive',  badge: 'coupon-badge coupon-badge--inactive' },
  expired:   { label: 'Expired',   badge: 'coupon-badge coupon-badge--expired' },
  scheduled: { label: 'Scheduled', badge: 'coupon-badge coupon-badge--scheduled' },
};

// â”€â”€ Blank form (matches real DB columns only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BLANK = {
  code:             '',
  description:      '',
  discount_type:    'percentage',   // 'percentage' | 'flat'
  discount_value:   '',
  min_order_amount: '',
  max_order_amount: '',
  usage_limit:      '',
  start_date:       '',
  end_date:         '',
  status:           'Active',       // 'Active' | 'Inactive'
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CopyBtn
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    });
  };
  return (
    <button
      className="coupon-copy-btn"
      onClick={copy}
      title="Copy code"
      aria-label="Copy coupon code"
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CouponModal  â€”  Add / Edit
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function CouponModal({ coupon, onClose, onSuccess }) {
  const isEdit = Boolean(coupon);

  const [form, setForm] = useState(() => {
    if (!isEdit) return { ...BLANK };
    return {
      code:             coupon.code            ?? '',
      description:      coupon.description     ?? '',
      discount_type:    coupon.discount_type   ?? 'percentage',
      discount_value:   coupon.discount_value  != null ? String(coupon.discount_value)  : '',
      min_order_amount: coupon.min_order_amount != null ? String(coupon.min_order_amount) : '',
      max_order_amount: coupon.max_order_amount != null ? String(coupon.max_order_amount) : '',
      usage_limit:      coupon.usage_limit     != null ? String(coupon.usage_limit)     : '',
      start_date:       coupon.start_date ? coupon.start_date.slice(0, 10) : '',
      end_date:         coupon.end_date   ? coupon.end_date.slice(0, 10)   : '',
      status:           coupon.status     ?? 'Active',
    };
  });

  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [serverErr, setServerErr] = useState('');

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  // â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function validate() {
    const e = {};
    const code = form.code.trim().toUpperCase();

    if (!code)
      e.code = 'Coupon code is required.';
    else if (!/^[A-Z0-9_-]{3,32}$/.test(code))
      e.code = 'Code must be 3â€“32 characters: Aâ€“Z, 0â€“9, hyphen, or underscore.';

    const val = Number(form.discount_value);
    if (!form.discount_value || isNaN(val) || val <= 0)
      e.discount_value = 'Enter a positive discount value.';
    else if (form.discount_type === 'percentage' && val > 100)
      e.discount_value = 'Percentage cannot exceed 100.';

    if (form.min_order_amount !== '' && Number(form.min_order_amount) < 0)
      e.min_order_amount = 'Cannot be negative.';
    if (form.max_order_amount !== '' && Number(form.max_order_amount) <= 0)
      e.max_order_amount = 'Must be positive.';
    if (
      form.min_order_amount !== '' &&
      form.max_order_amount !== '' &&
      Number(form.max_order_amount) <= Number(form.min_order_amount)
    )
      e.max_order_amount = 'Max order must be greater than min order.';
    if (form.usage_limit !== '' && Number(form.usage_limit) < 1)
      e.usage_limit = 'Usage limit must be at least 1.';
    if (form.start_date && form.end_date && form.end_date <= form.start_date)
      e.end_date = 'End date must be after start date.';

    setErrors(e);
    return !Object.keys(e).length;
  }

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setServerErr('');
    setSaving(true);

    const payload = {
      code:             form.code.trim().toUpperCase(),
      description:      form.description.trim() || null,
      discount_type:    form.discount_type,
      discount_value:   Number(form.discount_value),
      min_order_amount: form.min_order_amount !== '' ? Number(form.min_order_amount) : null,
      max_order_amount: form.max_order_amount !== '' ? Number(form.max_order_amount) : null,
      usage_limit:      form.usage_limit      !== '' ? Number(form.usage_limit)      : null,
      start_date:       form.start_date || null,
      end_date:         form.end_date   || null,
      status:           form.status,
    };

    try {
      if (isEdit) {
        await apiFetch(`/coupons/admin/${coupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/coupons/admin', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSuccess(`Coupon "${payload.code}" ${isEdit ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      setServerErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Coupon' : 'Add New Coupon'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-form">

            {/* Server error */}
            {serverErr && (
              <div className="coupon-server-err">
                <AlertCircle size={15} />
                <span>{serverErr}</span>
              </div>
            )}

            {/* Code */}
            <div className="form-group">
              <label>Coupon Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="e.g. SUMMER25"
                maxLength={32}
                className={errors.code ? 'input-error' : ''}
                style={{ fontFamily: 'monospace', letterSpacing: '0.06em', fontWeight: 700 }}
              />
              {errors.code && <span className="coupon-field-err">{errors.code}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Short note shown to customers on apply"
              />
            </div>

            {/* Discount type + value */}
            <div className="form-row">
              <div className="form-group">
                <label>Discount Type *</label>
                <select
                  value={form.discount_type}
                  onChange={e => set('discount_type', e.target.value)}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (à§³)</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  {form.discount_type === 'percentage' ? 'Percentage Value *' : 'Flat Amount (à§³) *'}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  value={form.discount_value}
                  onChange={e => set('discount_value', e.target.value)}
                  placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                  className={errors.discount_value ? 'input-error' : ''}
                />
                {errors.discount_value && (
                  <span className="coupon-field-err">{errors.discount_value}</span>
                )}
              </div>
            </div>

            {/* Min / Max order amounts */}
            <div className="form-row">
              <div className="form-group">
                <label>Minimum Order Amount (à§³)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.min_order_amount}
                  onChange={e => set('min_order_amount', e.target.value)}
                  placeholder="0 = no minimum"
                  className={errors.min_order_amount ? 'input-error' : ''}
                />
                {errors.min_order_amount && (
                  <span className="coupon-field-err">{errors.min_order_amount}</span>
                )}
              </div>
              <div className="form-group">
                <label>Maximum Order Amount (à§³)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.max_order_amount}
                  onChange={e => set('max_order_amount', e.target.value)}
                  placeholder="blank = no cap"
                  className={errors.max_order_amount ? 'input-error' : ''}
                />
                {errors.max_order_amount && (
                  <span className="coupon-field-err">{errors.max_order_amount}</span>
                )}
              </div>
            </div>

            {/* Usage limit */}
            <div className="form-group">
              <label>Total Usage Limit</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.usage_limit}
                onChange={e => set('usage_limit', e.target.value)}
                placeholder="e.g. 100 â€” leave blank for unlimited"
                className={errors.usage_limit ? 'input-error' : ''}
              />
              {errors.usage_limit && (
                <span className="coupon-field-err">{errors.usage_limit}</span>
              )}
            </div>

            {/* Date range */}
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => set('start_date', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date (Expiry)</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={e => set('end_date', e.target.value)}
                  className={errors.end_date ? 'input-error' : ''}
                />
                {errors.end_date && (
                  <span className="coupon-field-err">{errors.end_date}</span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label>Status</label>
              <div className="coupon-toggle-row">
                <span className="coupon-toggle-hint">
                  {form.status === 'Active'
                    ? 'Active â€” customers can apply this coupon'
                    : 'Inactive â€” coupon is disabled'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.status === 'Active'}
                  className={`coupon-toggle ${form.status === 'Active' ? 'coupon-toggle--on' : ''}`}
                  onClick={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')}
                >
                  <span className="coupon-toggle-thumb" />
                </button>
              </div>
            </div>

          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Savingâ€¦' : isEdit ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AdminCoupons â€” main page
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function AdminCoupons() {
  const [coupons,      setCoupons]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [toast,        setToast]        = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim())         params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await apiFetch(`/coupons/admin?${params}`);
      setCoupons(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Fetch coupons:', err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // â”€â”€ Quick status toggle (Active â†” Inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleToggleStatus = async (c) => {
    const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiFetch(`/coupons/admin/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`"${c.code}" set to ${newStatus}.`);
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Update failed.');
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/coupons/admin/${c.id}`, { method: 'DELETE' });
      showToast(`Coupon "${c.code}" deleted.`);
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  const openCreate = ()  => { setEditing(null); setShowModal(true); };
  const openEdit   = (c) => { setEditing(c);    setShowModal(true); };
  const closeModal = ()  => { setShowModal(false); setEditing(null); };
  const onSuccess  = (msg) => { closeModal(); fetchCoupons(); showToast(msg); };

  // â”€â”€ Summary counts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const counts = coupons.reduce((acc, c) => {
    const s = derivedStatus(c);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="admin-page">

      {/* Toast */}
      {toast && <div className="coupon-toast" role="status">{toast}</div>}

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Coupon Management</h1>
          <p className="admin-subtitle">
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add New Coupon
        </button>
      </div>

      {/* Stats pills â€” clickable to filter */}
      {!loading && coupons.length > 0 && (
        <div className="coupon-stats-bar">
          {['active', 'scheduled', 'inactive', 'expired'].map(s =>
            (counts[s] || 0) > 0 && (
              <button
                key={s}
                className={`coupon-stat coupon-stat--${s}${statusFilter === s ? ' coupon-stat--selected' : ''}`}
                onClick={() => setStatusFilter(prev => prev === s ? 'all' : s)}
              >
                <span className="coupon-stat__n">{counts[s]}</span>
                <span className="coupon-stat__l">{STATUS_META[s].label}</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by coupon code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">Loading couponsâ€¦</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type &amp; Value</th>
                <th>Min Order</th>
                <th>Max Order</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    {search || statusFilter !== 'all'
                      ? 'No coupons match the current filters.'
                      : 'No coupons yet â€” create your first one!'}
                  </td>
                </tr>
              ) : coupons.map(c => {
                const st       = derivedStatus(c);
                const meta     = STATUS_META[st];
                const usageLim = c.usage_limit != null ? c.usage_limit : 'âˆž';
                const usedN    = c.usage_count ?? 0;
                const isFull   = c.usage_limit != null && usedN >= c.usage_limit;
                const isExpired = st === 'expired';

                return (
                  <tr key={c.id} className={isExpired ? 'hidden-row' : ''}>

                    {/* Code + copy */}
                    <td>
                      <div className="coupon-code-cell">
                        <span className="coupon-code-text">{c.code}</span>
                        <CopyBtn text={c.code} />
                      </div>
                      {c.description && (
                        <div className="coupon-desc">{c.description}</div>
                      )}
                    </td>

                    {/* Discount type + value */}
                    <td style={{ whiteSpace: 'nowrap' }}>{discountLabel(c)}</td>

                    {/* Min order */}
                    <td>
                      {c.min_order_amount != null && Number(c.min_order_amount) > 0
                        ? `à§³${c.min_order_amount}` : 'â€”'}
                    </td>

                    {/* Max order */}
                    <td>
                      {c.max_order_amount != null && Number(c.max_order_amount) > 0
                        ? `à§³${c.max_order_amount}` : 'â€”'}
                    </td>

                    {/* Usage count / limit */}
                    <td>
                      <span className={`coupon-usage${isFull ? ' coupon-usage--full' : ''}`}>
                        {usedN} / {usageLim}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(c.end_date)}</td>

                    {/* Derived status badge */}
                    <td><span className={meta.badge}>{meta.label}</span></td>

                    {/* Quick Active/Inactive toggle */}
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={c.status === 'Active'}
                        className={`coupon-toggle coupon-toggle--sm${c.status === 'Active' ? ' coupon-toggle--on' : ''}`}
                        onClick={() => handleToggleStatus(c)}
                        disabled={isExpired}
                        title={c.status === 'Active' ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className="coupon-toggle-thumb" />
                      </button>
                    </td>

                    {/* Edit / Delete */}
                    <td className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => openEdit(c)}
                        title="Edit"
                        aria-label={`Edit ${c.code}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(c)}
                        title="Delete"
                        aria-label={`Delete ${c.code}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <CouponModal
          coupon={editing}
          onClose={closeModal}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}

