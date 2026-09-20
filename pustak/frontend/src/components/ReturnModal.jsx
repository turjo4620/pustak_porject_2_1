import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '../api/http'
import './ReturnModal.css'

// ── Preset return reasons ─────────────────────────────────────────
const REASONS = [
  { value: '',                      label: 'কারণ নির্বাচন করুন...' },
  { value: 'Damaged book',          label: 'বই ক্ষতিগ্রস্ত / ছেঁড়া'       },
  { value: 'Wrong item received',   label: 'ভুল বই পাঠানো হয়েছে'         },
  { value: 'Defective print',       label: 'প্রিন্টিং ত্রুটি / অস্পষ্ট'   },
  { value: 'Missing pages',         label: 'পৃষ্ঠা অনুপস্থিত'              },
  { value: 'Not as described',      label: 'বর্ণনার সাথে মেলেনি'          },
  { value: 'Other',                 label: 'অন্যান্য (নিচে লিখুন)'        },
]

const fmtAmt = (n) =>
  String(Number(n).toFixed(2)).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

// ── ReturnModal ───────────────────────────────────────────────────
/**
 * Props
 *   item        — the order_item row: { order_item_id, book_name, author,
 *                   cover_image_url, line_total, quantity }
 *   onClose()   — called when modal should disappear
 *   onSuccess(returnRow) — called after successful submission
 */
export default function ReturnModal({ item, onClose, onSuccess }) {
  const [reason,      setReason]      = useState('')
  const [customNote,  setCustomNote]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [submitted,   setSubmitted]   = useState(false)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!reason) {
      setError('অনুগ্রহ করে একটি কারণ নির্বাচন করুন।')
      return
    }
    if (reason === 'Other' && !customNote.trim()) {
      setError('"অন্যান্য" নির্বাচন করলে বিস্তারিত লিখুন।')
      return
    }

    const finalReason = reason === 'Other'
      ? `Other: ${customNote.trim()}`
      : reason

    setSubmitting(true)
    try {
      const res = await api.post('/returns', {
        orderItemId: item.order_item_id,
        reason:      finalReason,
      })
      setSubmitted(true)
      onSuccess?.(res.data)
    } catch (err) {
      setError(err.message || 'রিটার্ন রিকোয়েস্ট করা যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────
  const successScreen = (
    <div className="rm__success">
      <CheckCircle2 size={48} className="rm__success-icon" />
      <h3 className="rm__success-title">রিটার্ন রিকোয়েস্ট সম্পন্ন!</h3>
      <p className="rm__success-body">
        আপনার রিটার্ন রিকোয়েস্ট সফলভাবে জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।
      </p>
      <button className="rm__btn rm__btn--primary" onClick={onClose}>
        ঠিক আছে
      </button>
    </div>
  )

  // ── Form ──────────────────────────────────────────────────────
  const formScreen = (
    <form className="rm__form" onSubmit={handleSubmit} noValidate>

      {/* Book preview */}
      <div className="rm__item-preview">
        <div className="rm__item-thumb">
          {item.cover_image_url
            ? <img src={item.cover_image_url} alt={item.book_name} className="rm__item-img" />
            : <div className="rm__item-img-placeholder" />
          }
        </div>
        <div className="rm__item-info">
          <p className="rm__item-title">{item.book_name}</p>
          {item.author && <p className="rm__item-author">{item.author}</p>}
          <p className="rm__item-price">
            মূল্য: ৳{fmtAmt(item.line_total || 0)}
            {item.quantity > 1 && ` (×${item.quantity})`}
          </p>
        </div>
      </div>

      <div className="rm__divider" />

      {/* Reason dropdown */}
      <div className="rm__field">
        <label htmlFor="rm-reason" className="rm__label">
          রিটার্নের কারণ <span className="rm__required">*</span>
        </label>
        <select
          id="rm-reason"
          className="rm__select"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError('') }}
          required
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value} disabled={r.value === ''}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom note — shown only when "Other" is selected */}
      {reason === 'Other' && (
        <div className="rm__field">
          <label htmlFor="rm-note" className="rm__label">
            বিস্তারিত লিখুন <span className="rm__required">*</span>
          </label>
          <textarea
            id="rm-note"
            className="rm__textarea"
            rows={3}
            placeholder="সমস্যার বিস্তারিত বিবরণ দিন..."
            value={customNote}
            onChange={(e) => { setCustomNote(e.target.value); setError('') }}
            maxLength={500}
          />
          <span className="rm__char-count">{customNote.length}/500</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rm__error-banner" role="alert">
          <AlertCircle size={15} className="rm__error-icon" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="rm__actions">
        <button
          type="button"
          className="rm__btn rm__btn--ghost"
          onClick={onClose}
          disabled={submitting}
        >
          বাতিল করুন
        </button>
        <button
          type="submit"
          className="rm__btn rm__btn--primary"
          disabled={submitting || !reason}
        >
          <RotateCcw size={15} />
          {submitting ? 'জমা হচ্ছে...' : 'রিটার্ন রিকোয়েস্ট করুন'}
        </button>
      </div>
    </form>
  )

  return createPortal(
    <div className="rm__backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="রিটার্ন রিকোয়েস্ট">
      <div className="rm__panel">

        {/* Header */}
        <div className="rm__header">
          <div className="rm__header-left">
            <RotateCcw size={18} className="rm__header-icon" />
            <h2 className="rm__title">রিটার্ন রিকোয়েস্ট</h2>
          </div>
          <button
            className="rm__close"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="rm__body">
          {submitted ? successScreen : formScreen}
        </div>
      </div>
    </div>,
    document.body
  )
}
