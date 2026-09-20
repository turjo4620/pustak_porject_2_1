import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, RotateCcw } from 'lucide-react'
import { api } from '../api/http'
import { ORDER_STAGES, statusIndex } from '../utils/orderStages'
import './account-dashboard.css'

// ── Bengali helpers ─────────────────────────────────────────────────────────
const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])
const fmtBnAmount = (n) => toBn(Number(n).toFixed(2))

// ── Status localisation ─────────────────────────────────────────────────────
const STATUS_BN = {
  pending:    'অপেক্ষমাণ',
  Pending:    'অপেক্ষমাণ',
  confirmed:  'নিশ্চিত',
  Confirmed:  'নিশ্চিত',
  paid:       'পরিশোধিত',
  Paid:       'পরিশোধিত',
  processing: 'প্রসেসিং',
  Processing: 'প্রসেসিং',
  shipped:    'পাঠানো হয়েছে',
  Shipped:    'পাঠানো হয়েছে',
  delivered:  'ডেলিভার্ড',
  Delivered:  'ডেলিভার্ড',
  cancelled:  'বাতিল',
  Cancelled:  'বাতিল',
}

const STATUS_STYLE = {
  Pending:    { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  pending:    { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  Confirmed:  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  confirmed:  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  Paid:       { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  paid:       { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  Processing: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  processing: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Shipped:    { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  shipped:    { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  Delivered:  { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  delivered:  { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Cancelled:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
}

function statusStyle(s) {
  return STATUS_STYLE[s] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
}

// ── Tracking modal ──────────────────────────────────────────────────────────
function TrackingModal({ orderId, orderNumber, onClose }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get(`/orders/${orderId}/tracking`)
      .then(d  => setData(d))
      .catch(e => setError(e.message || 'ট্র্যাকিং তথ্য লোড করা যায়নি'))
      .finally(() => setLoading(false))
  }, [orderId])

  // Resolve current step index from the same helper used by OrderDetailPage
  const currentStatus = data?.order?.status || ''
  const currentIdx    = statusIndex(currentStatus)
  const delivery      = data?.delivery

  return (
    <div className="tracking-modal-backdrop" onClick={onClose}>
      <div className="tracking-modal" onClick={e => e.stopPropagation()}>

        <div className="tracking-modal__header">
          <h3>ট্র্যাকিং — #{orderNumber}</h3>
          <button
            className="tracking-modal__close"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >✕</button>
        </div>

        {loading && <p className="tracking-modal__info">লোড হচ্ছে...</p>}
        {error   && <p className="tracking-modal__error">{error}</p>}

        {!loading && !error && (
          <>
            {/* ── 5-step timeline using ORDER_STAGES ── */}
            <ul className="tracking-timeline">
              {ORDER_STAGES.map((stage, i) => {
                const done   = currentIdx >= i
                const active = currentIdx === i
                const order  = data?.order

                let sublabel = null
                if (i === 0 && done) {
                  sublabel = order?.order_date
                    ? new Date(order.order_date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                    : null
                } else if (i === 1 && done) {
                  sublabel = order?.confirmed_at
                    ? new Date(order.confirmed_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                    : null
                } else if (i === 2 && done) {
                  sublabel = order?.packed_at
                    ? new Date(order.packed_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                    : null
                } else if (i === 3 && done) {
                  if (delivery?.dispatch_date) {
                    sublabel = new Date(delivery.dispatch_date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                    if (delivery.courier_name) sublabel += ` · ${delivery.courier_name}`
                    if (delivery.tracking_no)  sublabel += ` · ${delivery.tracking_no}`
                  } else if (delivery?.courier_name) {
                    sublabel = delivery.courier_name +
                      (delivery.tracking_no ? ` · ${delivery.tracking_no}` : '')
                  }
                } else if (i === 4 && done) {
                  if (delivery?.delivered_at) {
                    sublabel = new Date(delivery.delivered_at)
                      .toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                  } else if (delivery?.est_date) {
                    sublabel = 'আনু. ' + new Date(delivery.est_date)
                      .toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                  }
                }

                return (
                  <li
                    key={stage.key}
                    className={[
                      'tracking-step',
                      done   ? 'tracking-step--done'   : '',
                      active ? 'tracking-step--active' : '',
                    ].join(' ').trim()}
                  >
                    <span className="tracking-step__dot" />
                    {i < ORDER_STAGES.length - 1 && (
                      <span className={`tracking-step__line${done ? ' tracking-step__line--done' : ''}`} />
                    )}
                    <div className="tracking-step__content">
                      <span className="tracking-step__label">{stage.label}</span>
                      {sublabel && (
                        <span className="tracking-step__sub">{sublabel}</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* ── Delivery detail table (only when dispatched) ── */}
            {delivery ? (
              <table className="tracking-table">
                <tbody>
                  {delivery.tracking_no    && <tr><td>ট্র্যাকিং নম্বর</td><td><strong>{delivery.tracking_no}</strong></td></tr>}
                  {delivery.courier_name   && <tr><td>কুরিয়ার</td><td>{delivery.courier_name}</td></tr>}
                  {delivery.dispatch_date  && <tr><td>প্রেরণের তারিখ</td><td>{new Date(delivery.dispatch_date).toLocaleDateString('bn-BD')}</td></tr>}
                  {delivery.est_date       && <tr><td>আনুমানিক ডেলিভারি</td><td>{new Date(delivery.est_date).toLocaleDateString('bn-BD')}</td></tr>}
                  {delivery.delivered_at   && <tr><td>ডেলিভারির তারিখ</td><td>{new Date(delivery.delivered_at).toLocaleDateString('bn-BD')}</td></tr>}
                  {delivery.delivery_charge && <tr><td>ডেলিভারি চার্জ</td><td>৳{delivery.delivery_charge}</td></tr>}
                  <tr><td>ডেলিভারি অবস্থা</td><td>{delivery.status || '—'}</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="tracking-modal__info">
                এই অর্ডারটি এখনও প্রেরণ করা হয়নি। প্রস্তুত হলে ট্র্যাকিং তথ্য এখানে দেখা যাবে।
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function AccountOrders() {
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [tab,     setTab]     = useState('all')
  const [trackingOrder, setTrackingOrder] = useState(null)

  useEffect(() => {
    api.get('/orders')
      .then(data => setOrders(data || []))
      .catch(err => setError(err.message || 'অর্ডার লোড করা যায়নি।'))
      .finally(() => setLoading(false))
  }, [])

  const TAB_STATUS = {
    all:        null,
    topay:      'Pending',
    processing: 'Processing',
    shipped:    'Shipped',
    delivered:  'Delivered',
  }

  const TABS = [
    { key: 'all',        label: 'সব অর্ডার' },
    { key: 'topay',      label: 'পেমেন্ট বাকি' },
    { key: 'processing', label: 'প্রসেসিং' },
    { key: 'shipped',    label: 'পাঠানো হয়েছে' },
    { key: 'delivered',  label: 'ডেলিভার্ড' },
  ]

  // Counts per tab
  const tabCounts = TABS.reduce((acc, t) => {
    acc[t.key] = TAB_STATUS[t.key]
      ? orders.filter(o => o.status === TAB_STATUS[t.key]).length
      : orders.length
    return acc
  }, {})

  const filtered = orders.filter(o => {
    const matchTab    = !TAB_STATUS[tab] || o.status === TAB_STATUS[tab]
    const matchSearch = !search.trim() ||
      o.order_number?.toLowerCase().includes(search.trim().toLowerCase()) ||
      String(o.order_id).includes(search.trim())
    return matchTab && matchSearch
  })

  return (
    <div className="account-orders-section">

      {/* ── Header: search + tabs ── */}
      <div className="orders-header card">

        {/* Real search bar */}
        <div className="orders-search-wrap">
          <Search size={16} className="orders-search-icon" />
          <input
            type="text"
            placeholder="অর্ডার নম্বর দিয়ে খুঁজুন"
            className="orders-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="orders-search-clear" onClick={() => setSearch('')} aria-label="মুছুন">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter tabs with count badges */}
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

      {!loading && !error && filtered.length === 0 && (
        <div className="card orders-empty">কোনো অর্ডার পাওয়া যায়নি।</div>
      )}

      {/* ── Order cards ── */}
      {!loading && filtered.map(order => {
        const { bg, color, border } = statusStyle(order.status)
        const isPending   = order.status === 'Pending'   || order.status === 'pending'
        const isDelivered = order.status === 'Delivered' || order.status === 'delivered'

        return (
          <div key={order.order_id} className="order-card">

            {/* Top bar */}
            <div className="order-card__header">
              <div className="order-card__id-group">
                <span className="order-card__label">অর্ডার</span>
                <span className="order-card__number">#{order.order_number}</span>
              </div>
              <div className="order-card__meta">
                <span className="order-card__date">
                  {new Date(order.order_date).toLocaleDateString('bn-BD', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </span>
                <span
                  className="order-card__status"
                  style={{ background: bg, color, border: `1px solid ${border}` }}
                >
                  {STATUS_BN[order.status] || order.status}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="order-card__body">

              {/* Book thumbnails preview */}
              {order.items && order.items.length > 0 && (
                <div className="order-card__items">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="order-card__item">
                      <div className="order-card__thumb-wrap">
                        <img
                          src={item.cover_image_url}
                          alt={item.book_name}
                          className="order-card__thumb"
                        />
                      </div>
                      <div className="order-card__item-info">
                        <span className="order-card__item-title">{item.book_name}</span>
                        <span className="order-card__item-qty">×{toBn(item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <span className="order-card__more">+{toBn(order.items.length - 4)}</span>
                  )}
                </div>
              )}

              {/* Price row */}
              <div className="order-card__price-row">
                <span className="order-card__price-label">মোট পরিমাণ</span>
                <span className="order-card__price">৳{fmtBnAmount(order.total_amount)}</span>
              </div>
            </div>

            {/* Footer: action buttons */}
            <div className="order-card__footer">
              {isPending && (
                <button
                  className="order-btn order-btn--primary"
                  onClick={() => navigate(`/payment/${order.order_id}`)}
                >
                  পেমেন্ট সম্পন্ন করুন
                </button>
              )}
              <button
                className="order-btn order-btn--ghost"
                onClick={() => setTrackingOrder({ order_id: order.order_id, order_number: order.order_number })}
              >
                ট্র্যাক করুন
              </button>
              <button
                className="order-btn order-btn--outline"
                onClick={() => navigate(`/account/orders/${order.order_id}`)}
              >
                বিস্তারিত দেখুন
              </button>
              {isDelivered && (
                <button
                  className="order-btn order-btn--return"
                  onClick={() => navigate(`/account/orders/${order.order_id}`)}
                  title="রিটার্ন রিকোয়েস্ট করুন"
                >
                  <RotateCcw size={13} />
                  রিটার্ন করুন
                </button>
              )}
            </div>
          </div>
        )
      })}

      {trackingOrder && (
        <TrackingModal
          orderId={trackingOrder.order_id}
          orderNumber={trackingOrder.order_number}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  )
}
