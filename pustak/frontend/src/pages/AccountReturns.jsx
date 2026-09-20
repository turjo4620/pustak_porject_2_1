import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, PackageSearch } from 'lucide-react'
import { api } from '../api/http'
import './account-dashboard.css'

// ── Bengali helpers ───────────────────────────────────────────────────────────
const toBn   = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])
const fmtAmt = (n) => toBn(Number(n).toFixed(2))

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Status config ─────────────────────────────────────────────────────────────
const RETURN_STATUS = {
  initiated: { label: 'পর্যালোচনাধীন', cls: 'ar-badge ar-badge--pending'  },
  approved:  { label: 'অনুমোদিত',      cls: 'ar-badge ar-badge--approved' },
  rejected:  { label: 'প্রত্যাখ্যাত',  cls: 'ar-badge ar-badge--rejected' },
}

const REFUND_STATUS = {
  Pending:   { label: 'রিফান্ড প্রক্রিয়াধীন', cls: 'ar-badge ar-badge--refund-pending' },
  Processed: { label: 'রিফান্ড সম্পন্ন',       cls: 'ar-badge ar-badge--refund-done'    },
  Failed:    { label: 'রিফান্ড ব্যর্থ',         cls: 'ar-badge ar-badge--refund-failed'  },
}

const REASON_BN = {
  'Damaged book':        'বই ক্ষতিগ্রস্ত / ছেঁড়া',
  'Wrong item received': 'ভুল বই পাঠানো হয়েছে',
  'Defective print':     'প্রিন্টিং ত্রুটি / অস্পষ্ট',
  'Missing pages':       'পৃষ্ঠা অনুপস্থিত',
  'Not as described':    'বর্ণনার সাথে মেলেনি',
}

function localiseReason(reason) {
  if (!reason) return '—'
  if (reason.startsWith('Other: ')) return reason.slice(7)
  return REASON_BN[reason] || reason
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',       label: 'সব রিটার্ন'     },
  { key: 'initiated', label: 'পর্যালোচনাধীন'  },
  { key: 'approved',  label: 'অনুমোদিত'        },
  { key: 'rejected',  label: 'প্রত্যাখ্যাত'    },
]

// ═════════════════════════════════════════════════════════════════════════════
export default function AccountReturns() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState('all')

  useEffect(() => {
    api.get('/returns')
      .then(data => setReturns(data?.data || []))
      .catch(err => setError(err.message || 'রিটার্ন তথ্য লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [])

  // Count per tab
  const tabCounts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? returns.length
      : returns.filter(r => r.return_status === t.key).length
    return acc
  }, {})

  const filtered = tab === 'all'
    ? returns
    : returns.filter(r => r.return_status === tab)

  return (
    <div className="account-returns-section">

      {/* ── Page title + tabs ── */}
      <div className="ar-header card">
        <div className="ar-title-row">
          <RotateCcw size={20} className="ar-title-icon" />
          <h2 className="ar-title">রিটার্ন ও রিফান্ড</h2>
        </div>

        <div className="orders-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {tabCounts[t.key] > 0 && (
                <span className="tab-badge">{toBn(tabCounts[t.key])}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error   && <div className="card error-banner">{error}</div>}
      {loading && <div className="card orders-loading">লোড হচ্ছে...</div>}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card ar-empty">
          <PackageSearch size={48} className="ar-empty-icon" />
          <p className="ar-empty-title">কোনো রিটার্ন রিকোয়েস্ট নেই</p>
          <p className="ar-empty-sub">
            ডেলিভার্ড অর্ডারের বিস্তারিত পেজ থেকে পণ্য রিটার্ন করা যাবে।
          </p>
          <button
            className="order-btn order-btn--outline"
            onClick={() => navigate('/account/orders')}
          >
            অর্ডার দেখুন
          </button>
        </div>
      )}

      {/* ── Return cards ── */}
      {!loading && !error && filtered.map(ret => {
        const statusInfo = RETURN_STATUS[ret.return_status] || {
          label: ret.return_status,
          cls: 'ar-badge',
        }
        const refundInfo = ret.refund_status ? REFUND_STATUS[ret.refund_status] : null

        return (
          <div key={ret.return_id} className="ar-card card">

            {/* Card header: book thumbnail + name + badges */}
            <div className="ar-card__header">
              <div className="ar-card__book-info">
                {ret.cover_image_url
                  ? <img
                      src={ret.cover_image_url}
                      alt={ret.book_name}
                      className="ar-card__thumb"
                    />
                  : <div className="ar-card__thumb-placeholder" />
                }
                <div className="ar-card__meta">
                  <span className="ar-card__book-name">{ret.book_name}</span>
                  <span className="ar-card__order-num">
                    অর্ডার #{ret.order_number}
                  </span>
                </div>
              </div>

              <div className="ar-card__badges">
                <span className={statusInfo.cls}>
                  <RotateCcw size={11} />
                  {statusInfo.label}
                </span>
                {refundInfo && (
                  <span className={refundInfo.cls}>{refundInfo.label}</span>
                )}
              </div>
            </div>

            {/* Card body: detail rows */}
            <div className="ar-card__body">
              <div className="ar-row">
                <span className="ar-row__label">কারণ</span>
                <span className="ar-row__value">{localiseReason(ret.reason)}</span>
              </div>
              <div className="ar-row">
                <span className="ar-row__label">রিকোয়েস্টের তারিখ</span>
                <span className="ar-row__value">{fmtDate(ret.request_date)}</span>
              </div>
              {ret.approved_at && (
                <div className="ar-row">
                  <span className="ar-row__label">অনুমোদনের তারিখ</span>
                  <span className="ar-row__value">{fmtDate(ret.approved_at)}</span>
                </div>
              )}
              {ret.refund_amount && (
                <div className="ar-row">
                  <span className="ar-row__label">রিফান্ডের পরিমাণ</span>
                  <span className="ar-row__value ar-row__value--amount">
                    ৳{fmtAmt(ret.refund_amount)}
                  </span>
                </div>
              )}
              {ret.refunded_at && (
                <div className="ar-row">
                  <span className="ar-row__label">রিফান্ডের তারিখ</span>
                  <span className="ar-row__value">{fmtDate(ret.refunded_at)}</span>
                </div>
              )}
            </div>

            {/* Card footer: view order button */}
            <div className="ar-card__footer">
              <button
                className="order-btn order-btn--ghost"
                onClick={() => navigate(`/account/orders/${ret.order_id}`)}
              >
                অর্ডার বিস্তারিত দেখুন
              </button>
            </div>

          </div>
        )
      })}
    </div>
  )
}
