import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Trash2, BookOpen, PenLine } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api/http'
import './account-dashboard.css'

// ── Bengali numeral helper ───────────────────────────────────────────────────
const toBn = (n) => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d])

// ── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ rating, size = 14, interactive = false, onChange }) {
  const [hover, setHover] = useState(0)
  const active = hover || rating

  return (
    <div className="ar-stars" aria-label={`রেটিং: ${rating} / ৫`}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          className={`ar-star ${i <= active ? 'ar-star--on' : ''} ${interactive ? 'ar-star--btn' : ''}`}
          style={{ fontSize: size }}
          disabled={!interactive}
          onClick={interactive ? () => onChange?.(i) : undefined}
          onMouseEnter={interactive ? () => setHover(i) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          aria-label={`${i} তারা`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ── Single review card ────────────────────────────────────────────────────────
function ReviewCard({ review, onDelete, onEdit }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('এই রিভিউটি মুছে ফেলবেন?')) return
    setDeleting(true)
    try {
      await api.del(`/reviews/${review.review_id}`)
      onDelete(review.review_id)
    } catch (e) {
      alert(e.message || 'মুছে ফেলা যায়নি')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="ar-card card">
      {/* Book info row */}
      <div className="ar-card__header">
        <div
          className="ar-card__cover"
          onClick={() => navigate(`/book/${review.book_id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate(`/book/${review.book_id}`)}
        >
          {review.cover_image_url
            ? <img src={review.cover_image_url} alt={review.book_name} loading="lazy" />
            : <BookOpen size={20} />
          }
        </div>

        <div className="ar-card__meta">
          <p
            className="ar-card__title"
            onClick={() => navigate(`/book/${review.book_id}`)}
            role="button"
            tabIndex={0}
          >
            {review.book_name}
          </p>
          {review.author && (
            <p className="ar-card__author">{review.author}</p>
          )}
          <StarRow rating={review.rating} size={15} />
          <p className="ar-card__rating-text">
            {toBn(review.rating)}/৫ — {
              review.rating === 5 ? 'অসাধারণ' :
              review.rating === 4 ? 'ভালো' :
              review.rating === 3 ? 'মোটামুটি' :
              review.rating === 2 ? 'খারাপ' : 'অত্যন্ত খারাপ'
            }
          </p>
        </div>

        <div className="ar-card__actions">
          <button
            className="ar-action-btn ar-action-btn--edit"
            onClick={() => onEdit(review)}
            aria-label="সম্পাদনা"
            title="রিভিউ সম্পাদনা"
          >
            <PenLine size={14} />
          </button>
          <button
            className="ar-action-btn ar-action-btn--del"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="মুছুন"
            title="রিভিউ মুছুন"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="ar-card__comment">"{review.comment}"</p>
      )}
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ review, onClose, onSaved }) {
  const [rating,  setRating]  = useState(review.rating)
  const [comment, setComment] = useState(review.comment || '')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  const handleSave = async () => {
    setErr('')
    setSaving(true)
    try {
      await api.post('/reviews', {
        bookId:  review.book_id,
        rating,
        comment,
      })
      onSaved({ ...review, rating, comment })
    } catch (e) {
      setErr(e.message || 'সংরক্ষণ করা যায়নি')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ar-modal-backdrop" onClick={onClose}>
      <div className="ar-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ar-modal__header">
          <h3>রিভিউ সম্পাদনা</h3>
          <button className="ar-modal__close" onClick={onClose} aria-label="বন্ধ করুন">✕</button>
        </div>

        <p className="ar-modal__book">{review.book_name}</p>

        <div className="ar-modal__rating">
          <label className="ar-modal__label">রেটিং</label>
          <StarRow rating={rating} size={22} interactive onChange={setRating} />
        </div>

        <div className="ar-modal__field">
          <label className="ar-modal__label">মন্তব্য</label>
          <textarea
            className="ar-modal__textarea"
            rows={4}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="আপনার মতামত লিখুন..."
          />
        </div>

        {err && <p className="ar-modal__err">{err}</p>}

        <div className="ar-modal__footer">
          <button className="ar-btn ar-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
          <button className="ar-btn ar-btn--ghost" onClick={onClose}>বাতিল</button>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className="ar-empty">
      <Star size={42} className="ar-empty__icon" strokeWidth={1.2} />
      <p className="ar-empty__title">কোনো রিভিউ নেই</p>
      <p className="ar-empty__sub">বই কিনুন এবং পড়ার পর আপনার মতামত জানান।</p>
      <button className="ar-btn ar-btn--primary" onClick={() => navigate('/account/order')}>
        বই অর্ডার করুন
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AccountReviews() {
  const { authUser } = useApp()
  const navigate = useNavigate()

  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [editing,  setEditing]  = useState(null)   // review being edited

  useEffect(() => {
    if (!authUser) { navigate('/login'); return }
    api.get('/reviews/mine')
      .then(data => setReviews(data.data || []))
      .catch(err  => setError(err.message || 'রিভিউ লোড করা যায়নি'))
      .finally(()  => setLoading(false))
  }, [authUser, navigate])

  const handleDelete = (reviewId) => {
    setReviews(prev => prev.filter(r => r.review_id !== reviewId))
  }

  const handleSaved = (updated) => {
    setReviews(prev => prev.map(r => r.review_id === updated.review_id ? updated : r))
    setEditing(null)
  }

  return (
    <div className="account-reviews-section">

      {/* Header */}
      <div className="card ar-header">
        <div className="ar-header__left">
          <Star size={18} className="ar-header__icon" />
          <div>
            <h2 className="ar-header__title">রিভিউ ও রেটিং</h2>
            <p className="ar-header__sub">
              {loading ? 'লোড হচ্ছে...' : `${toBn(reviews.length)}টি রিভিউ`}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="card error-banner">{error}</div>}

      {/* Loading skeletons */}
      {loading && (
        <div className="ar-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="ar-skeleton card" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && reviews.length === 0 && <EmptyState />}

      {/* Review cards */}
      {!loading && reviews.length > 0 && (
        <div className="ar-list">
          {reviews.map(r => (
            <ReviewCard
              key={r.review_id}
              review={r}
              onDelete={handleDelete}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
