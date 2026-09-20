import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, Download, Headphones,
  PackageCheck, Package, Truck, MapPin, Star,
  RotateCcw, XCircle, CheckCircle2,
} from 'lucide-react'
import { api } from '../api/http'
import { useApp } from '../context/AppContext'
import { ORDER_STAGES, statusIndex, isStageDone } from '../utils/orderStages'
import ReturnModal from '../components/ReturnModal'
import './OrderDetailPage.css'

// ── Bengali helpers ──────────────────────────────────────────────────────
const toBn  = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])
const fmtAmt = (n) => toBn(Number(n).toFixed(2))

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) + ' | ' + d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
}

// ── Status maps ──────────────────────────────────────────────────────────
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
  pending:    { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  Pending:    { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  confirmed:  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  Confirmed:  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  paid:       { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  Paid:       { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  processing: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Processing: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  shipped:    { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  Shipped:    { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  delivered:  { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Delivered:  { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  Cancelled:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
}

function statusStyle(s) {
  return STATUS_STYLE[s] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
}

// ── Payment method label ─────────────────────────────────────────────────
function methodLabel(method, provider, brand, last4) {
  if (!method) return '—'
  if (method === 'cod')  return 'ক্যাশ অন ডেলিভারি'
  if (method === 'mfs')  return provider ? `${provider}` : 'মোবাইল ব্যাংকিং'
  if (method === 'card') {
    if (brand && last4) return `${brand} (****${last4})`
    return brand || 'কার্ড পেমেন্ট'
  }
  return method
}

// ── Step icons (index-matched to ORDER_STAGES) ───────────────────────────
const STAGE_ICONS = [
  <Package      size={18} key="placed"    />,   // 0 placed
  <CheckCircle2 size={18} key="confirmed" />,   // 1 confirmed
  <PackageCheck size={18} key="packed"    />,   // 2 packed
  <Truck        size={18} key="shipped"   />,   // 3 shipped
  <MapPin       size={18} key="delivered" />,   // 4 delivered
]

// ── Build stepper data from ORDER_STAGES + live order/delivery data ───────
function buildSteps(order, delivery) {
  const currentIdx = statusIndex(order?.status)

  return ORDER_STAGES.map((stage, i) => {
    const done   = currentIdx >= i
    const active = currentIdx === i

    let sublabel = null

    if (i === 0) {
      // Placed — always show order date
      sublabel = order?.order_date ? fmtDate(order.order_date) : null

    } else if (i === 1) {
      // Confirmed
      if (done) {
        sublabel = order?.confirmed_at ? fmtDate(order.confirmed_at) : null
      }

    } else if (i === 2) {
      // Packed / Processing
      if (done) {
        sublabel = order?.packed_at ? fmtDate(order.packed_at) : null
      }

    } else if (i === 3) {
      // Shipped — prefer dispatch date, fall back to courier name
      if (done) {
        if (delivery?.dispatch_date) {
          sublabel = fmtDate(delivery.dispatch_date)
          if (delivery.courier_name) sublabel += ` · ${delivery.courier_name}`
          if (delivery.tracking_no)  sublabel += ` · ${delivery.tracking_no}`
        } else if (delivery?.courier_name) {
          sublabel = delivery.courier_name +
            (delivery.tracking_no ? ` · ${delivery.tracking_no}` : '')
        }
      }

    } else if (i === 4) {
      // Delivered
      if (done) {
        if (delivery?.delivered_at) {
          sublabel = fmtDate(delivery.delivered_at)
        } else if (delivery?.est_date) {
          sublabel = `আনু. ${fmtDate(delivery.est_date)}`
        }
      }
    }

    return { icon: STAGE_ICONS[i], label: stage.label, sublabel, done, active }
  })
}

// ── Review button component ──────────────────────────────────────────────
function ReviewBtn({ book }) {
  const navigate = useNavigate()
  return (
    <button
      className="odp__review-btn"
      onClick={() => navigate(`/book/${book.book_id || book.id}?review=1`)}
      title={`${book.book_name} সম্পর্কে রিভিউ দিন`}
    >
      <Star size={13} />
      রিভিউ দিন
    </button>
  )
}

// ── Return status badge / button ─────────────────────────────────────────
const RETURN_STATUS_BN = {
  initiated: { label: 'রিটার্ন পেন্ডিং',  cls: 'odp__return-badge--pending'  },
  approved:  { label: 'রিটার্ন অনুমোদিত', cls: 'odp__return-badge--approved' },
  rejected:  { label: 'রিটার্ন বাতিল',    cls: 'odp__return-badge--rejected' },
}

function ReturnItemCell({ item, returnRow, onRequest }) {
  if (returnRow) {
    const info = RETURN_STATUS_BN[returnRow.return_status] || {
      label: returnRow.return_status,
      cls: '',
    }
    // If approved and refund exists, show refund status too
    const refundLabel =
      returnRow.refund_status === 'Processed'
        ? ' · রিফান্ড সম্পন্ন'
        : returnRow.refund_status === 'Pending' && returnRow.return_status === 'approved'
        ? ' · রিফান্ড প্রক্রিয়াধীন'
        : ''

    return (
      <span className={`odp__return-badge ${info.cls}`}>
        <RotateCcw size={11} />
        {info.label}{refundLabel}
      </span>
    )
  }

  return (
    <button
      className="odp__return-btn"
      onClick={onRequest}
      title={`${item.book_name} রিটার্ন করুন`}
    >
      <RotateCcw size={13} />
      রিটার্ন করুন
    </button>
  )
}

// ── Invoice print/download ───────────────────────────────────────────────
function downloadInvoice(order, items, address, payment) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${item.book_name}${item.author ? `<br><small style="color:#6b7280">${item.author}</small>` : ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">৳${Number(item.unit_price || item.price || 0).toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">৳${Number(item.line_total || (item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>`).join('')

  const addrLine = address
    ? [address.street, address.area, address.district, address.division, address.postal_code].filter(Boolean).join(', ')
    : '—'

  const html = `<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>ইনভয়েস — #${order.order_number}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#111827;max-width:700px;margin:40px auto;padding:0 20px}
  h1{font-size:1.5rem;margin:0 0 4px}
  .meta{color:#6b7280;font-size:0.85rem;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:0.88rem}
  th{background:#f9fafb;padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb}
  tfoot td{padding:8px 12px;font-weight:700;border-top:2px solid #e5e7eb}
  .section{margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;font-size:0.88rem}
  .section h3{margin:0 0 8px;font-size:0.92rem}
  .logo{font-size:1.1rem;font-weight:800;color:#0f766e;margin-bottom:16px}
</style></head><body>
<div class="logo">📚 পুস্তক</div>
<h1>ইনভয়েস</h1>
<div class="meta">অর্ডার নম্বর: #${order.order_number} &nbsp;|&nbsp; তারিখ: ${fmtDate(order.order_date)}</div>
<table>
  <thead><tr><th>বই</th><th style="text-align:center">পরিমাণ</th><th style="text-align:right">একক মূল্য</th><th style="text-align:right">মোট</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr><td colspan="3" style="text-align:right">সর্বমোট প্রদেয়</td><td style="text-align:right">৳${Number(order.total_amount).toFixed(2)}</td></tr>
  </tfoot>
</table>
<div class="section">
  <h3>ডেলিভারি ঠিকানা</h3>
  <p style="margin:0;color:#374151">${addrLine}</p>
</div>
<div class="section">
  <h3>পেমেন্ট পদ্ধতি</h3>
  <p style="margin:0;color:#374151">${methodLabel(payment?.method, payment?.provider_name, payment?.card_brand, payment?.card_last_4_digits)}</p>
</div>
</body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `invoice-${order.order_number}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate    = useNavigate()
  const { addToCart, authUser } = useApp()

  const [order,   setOrder]   = useState(null)
  const [items,   setItems]   = useState([])
  const [address, setAddress] = useState(null)
  const [payment, setPayment] = useState(null)
  const [delivery,setDelivery]= useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [copied,  setCopied]  = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  // ── Return state ──────────────────────────────────────────────
  // returnMap: { [order_item_id]: { return_status, refund_status } }
  const [returnMap,    setReturnMap]    = useState({})
  const [returnModal,  setReturnModal]  = useState(null)  // item object or null

  // Fetch order + tracking in parallel
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/orders/${orderId}`),
      api.get(`/orders/${orderId}/tracking`).catch(() => null),
      api.get(`/returns/order/${orderId}`).catch(() => null),
    ])
      .then(([orderData, trackData, returnsData]) => {
        setOrder(orderData.order   || null)
        setItems(orderData.items   || [])
        setAddress(orderData.address || null)
        setPayment(orderData.payment || null)
        if (trackData?.delivery) setDelivery(trackData.delivery)
        // Build a lookup map: order_item_id → return row
        if (returnsData?.data?.length) {
          const map = {}
          returnsData.data.forEach((r) => { map[r.order_item_id] = r })
          setReturnMap(map)
        }
      })
      .catch(err => setError(err.message || 'অর্ডারের তথ্য লোড করা যায়নি'))
      .finally(() => setLoading(false))
  }, [orderId])

  const handleCopy = () => {
    if (!order?.order_number) return
    navigator.clipboard.writeText(order.order_number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleCancel = async () => {
    if (!window.confirm('আপনি কি এই অর্ডারটি বাতিল করতে চান?')) return
    setCancelling(true)
    try {
      await api.patch(`/orders/${orderId}/cancel`)
      setCancelDone(true)
      setOrder(prev => ({ ...prev, status: 'Cancelled' }))
    } catch (err) {
      alert(err.message || 'অর্ডার বাতিল করা যায়নি')
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = async () => {
    if (!authUser) { navigate('/login'); return }
    setReordering(true)
    try {
      for (const item of items) {
        await addToCart({
          id: item.book_id || item.id,
          book_name: item.book_name,
          price: item.unit_price || item.price,
          cover_image_url: item.cover_image_url,
          author: item.author,
        })
      }
      navigate('/cart')
    } catch (err) {
      alert(err.message || 'পুনরায় অর্ডার করা যায়নি')
    } finally {
      setReordering(false)
    }
  }

  // ── Derived values ────────────────────────────────────────────
  const status     = order?.status || ''
  const statusLow  = status.toLowerCase()
  const isDelivered = statusLow === 'delivered'
  const isCancelled = statusLow === 'cancelled'
  const isCancellable = ['pending','confirmed','paid','processing'].includes(statusLow) && !cancelDone
  const { bg, color, border } = statusStyle(status)

  const steps = order ? buildSteps(order, delivery) : []

  const subtotal       = items.reduce((s, i) => {
    const lt = Number(i.line_total) || 0
    const up = Number(i.unit_price) || Number(i.locked_price) || Number(i.price) || 0
    const q  = Number(i.quantity) || 1
    return s + (lt > 0 ? lt : up * q)
  }, 0)
  const deliveryCharge = Number(delivery?.delivery_charge || 0)
  const discount       = Number(order?.discount_amount || 0)
  const total          = Number(order?.total_amount || subtotal + deliveryCharge - discount)

  const addrLine = address
    ? [address.street, address.area, address.district, address.division].filter(Boolean).join(', ')
    : null

  const paymentPaid = payment?.status === 'Completed' || payment?.status === 'completed' || statusLow === 'paid' || statusLow === 'delivered'

  // ── Loading / error ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="odp">
        <div className="container odp__center">
          <div className="odp__spinner" />
          <p className="odp__loading-text">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="odp">
        <div className="container odp__center">
          <p className="odp__error">{error || 'অর্ডারের তথ্য পাওয়া যায়নি।'}</p>
          <button className="odp__back-link" onClick={() => navigate('/account/orders')}>
            ← সব অর্ডারে ফিরে যান
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="odp">
      <div className="odp__wrap">

        {/* ── Back link ──────────────────────────────────────────── */}
        <Link to="/account/orders" className="odp__back-link">
          <ArrowLeft size={15} />
          সব অর্ডারে ফিরে যান
        </Link>

        {/* ══════════════════════════════════════════════════════════
            PAGE HEADER: order meta + actions
        ══════════════════════════════════════════════════════════ */}
        <div className="odp__header card">
          <div className="odp__header-main">

            {/* Order number + copy */}
            <div className="odp__id-row">
              <span className="odp__id-label">অর্ডার নম্বর</span>
              <div className="odp__id-wrap">
                <span className="odp__id-value">#{order.order_number}</span>
                <button
                  className="odp__copy-btn"
                  onClick={handleCopy}
                  aria-label="অর্ডার নম্বর কপি করুন"
                >
                  {copied
                    ? <><Check size={13} className="odp__copy-done" /> কপি হয়েছে</>
                    : <><Copy size={13} /> কপি করুন</>
                  }
                </button>
              </div>
            </div>

            {/* Date + status */}
            <div className="odp__meta-row">
              <span className="odp__date">{fmtDateTime(order.order_date)}</span>
              <span
                className="odp__status-pill"
                style={{ background: bg, color, border: `1px solid ${border}` }}
              >
                {STATUS_BN[status] || status}
              </span>
            </div>
          </div>

          {/* Header actions */}
          <div className="odp__header-actions">
            <button
              className="odp__action-btn odp__action-btn--outline"
              onClick={() => downloadInvoice(order, items, address, payment)}
              title="ইনভয়েস ডাউনলোড করুন"
            >
              <Download size={15} />
              ইনভয়েস ডাউনলোড
            </button>
            <Link
              to="/account"
              className="odp__action-btn odp__action-btn--ghost"
              title="সহায়তা"
            >
              <Headphones size={15} />
              সহায়তা
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            STEPPER
        ══════════════════════════════════════════════════════════ */}
        {!isCancelled && (
          <div className="odp__stepper card">
            <h2 className="odp__section-title">অর্ডার ট্র্যাকিং</h2>
            <div className="odp__steps">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`odp__step ${step.done ? 'odp__step--done' : ''} ${step.active && !step.done ? 'odp__step--active' : ''}`}
                >
                  {/* Connector line before step */}
                  {i > 0 && (
                    <div className={`odp__step-line ${steps[i - 1].done ? 'odp__step-line--done' : ''}`} />
                  )}

                  <div className="odp__step-node">
                    <div className="odp__step-icon">{step.icon}</div>
                  </div>
                  <div className="odp__step-info">
                    <span className="odp__step-label">{step.label}</span>
                    {step.sublabel && (
                      <span className="odp__step-sub">{step.sublabel}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ITEMS TABLE
        ══════════════════════════════════════════════════════════ */}
        <div className="odp__items card">
          <h2 className="odp__section-title">বইয়ের তালিকা</h2>
          <div className="odp__table-wrap">
            <table className="odp__table">
              <thead>
                <tr>
                  <th className="odp__th odp__th--book">বই</th>
                  <th className="odp__th odp__th--num">একক মূল্য</th>
                  <th className="odp__th odp__th--num">পরিমাণ</th>
                  <th className="odp__th odp__th--num">সর্বমোট</th>
                  {isDelivered && <th className="odp__th odp__th--action"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  // Fix: unit_price may come as 0 or missing while line_total is correct.
                  // Derive unit price from line_total / quantity as a fallback.
                  const qty       = Number(item.quantity) || 1
                  const lineTotal = Number(item.line_total) || 0
                  const rawUnit   = Number(item.unit_price) || Number(item.locked_price) || Number(item.price) || 0
                  const unitPrice = rawUnit > 0 ? rawUnit : (lineTotal > 0 ? lineTotal / qty : 0)
                  return (
                    <tr key={i} className="odp__tr">
                      <td className="odp__td odp__td--book">
                        <div className="odp__item-inner">
                          <div className="odp__thumb-wrap">
                            {item.cover_image_url
                              ? <img src={item.cover_image_url} alt={item.book_name} className="odp__thumb" />
                              : <div className="odp__thumb-placeholder" />
                            }
                          </div>
                          <div className="odp__item-info">
                            <Link
                              to={`/book/${item.book_id || item.id}`}
                              className="odp__item-title"
                            >
                              {item.book_name}
                            </Link>
                            {item.author && (
                              <span className="odp__item-author">{item.author}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="odp__td odp__td--num">৳{fmtAmt(unitPrice)}</td>
                      <td className="odp__td odp__td--num">×{toBn(qty)}</td>
                      <td className="odp__td odp__td--num odp__td--total">৳{fmtAmt(lineTotal)}</td>
                      {isDelivered && (
                        <td className="odp__td odp__td--action">
                          <div className="odp__item-actions">
                            <ReviewBtn book={item} />
                            <ReturnItemCell
                              item={item}
                              returnRow={returnMap[item.order_item_id]}
                              onRequest={() => setReturnModal(item)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TWO-COLUMN INFO CARDS
        ══════════════════════════════════════════════════════════ */}
        <div className="odp__info-grid">

          {/* ── Shipping details ─────────────────────────────── */}
          <div className="odp__info-card card">
            <h2 className="odp__section-title">
              <MapPin size={15} className="odp__section-icon" />
              ডেলিভারি ঠিকানা
            </h2>

            {address ? (
              <div className="odp__info-rows">
                {address.recipient_name && (
                  <div className="odp__info-row">
                    <span className="odp__info-label">প্রাপক</span>
                    <span className="odp__info-value odp__info-value--strong">{address.recipient_name}</span>
                  </div>
                )}
                {address.phone && (
                  <div className="odp__info-row">
                    <span className="odp__info-label">ফোন</span>
                    <span className="odp__info-value">{address.phone}</span>
                  </div>
                )}
                {addrLine && (
                  <div className="odp__info-row">
                    <span className="odp__info-label">ঠিকানা</span>
                    <span className="odp__info-value">{addrLine}</span>
                  </div>
                )}
                <div className="odp__info-row">
                  <span className="odp__info-label">ডেলিভারি ধরন</span>
                  <span className="odp__info-value">
                    {delivery?.delivery_type || 'স্ট্যান্ডার্ড হোম ডেলিভারি'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="odp__info-empty">ঠিকানার তথ্য পাওয়া যায়নি।</p>
            )}
          </div>

          {/* ── Payment & cost breakdown ──────────────────────── */}
          <div className="odp__info-card card">
            <h2 className="odp__section-title">পেমেন্ট ও মূল্য সারসংক্ষেপ</h2>

            <div className="odp__info-rows">
              <div className="odp__info-row">
                <span className="odp__info-label">পেমেন্ট পদ্ধতি</span>
                <span className="odp__info-value odp__info-value--strong">
                  {methodLabel(payment?.method, payment?.provider_name, payment?.card_brand, payment?.card_last_4_digits)}
                </span>
              </div>

              {payment?.transaction_id && (
                <div className="odp__info-row">
                  <span className="odp__info-label">ট্রানজেকশন আইডি</span>
                  <span className="odp__info-value odp__info-value--mono">{payment.transaction_id}</span>
                </div>
              )}

              <div className="odp__info-row">
                <span className="odp__info-label">পেমেন্ট স্ট্যাটাস</span>
                <span className={`odp__pay-status ${paymentPaid ? 'odp__pay-status--paid' : 'odp__pay-status--due'}`}>
                  {paymentPaid ? 'পরিশোধিত' : 'বকেয়া'}
                </span>
              </div>
            </div>

            <div className="odp__cost-divider" />

            {/* Cost breakdown */}
            <div className="odp__cost-rows">
              <div className="odp__cost-row">
                <span>উপমোট</span>
                <span>৳{fmtAmt(subtotal)}</span>
              </div>
              <div className="odp__cost-row">
                <span>ডেলিভারি চার্জ</span>
                <span>{deliveryCharge > 0 ? `৳${fmtAmt(deliveryCharge)}` : 'বিনামূল্যে'}</span>
              </div>
              {discount > 0 && (
                <div className="odp__cost-row odp__cost-row--discount">
                  <span>প্রোমো কোড ছাড়</span>
                  <span>−৳{fmtAmt(discount)}</span>
                </div>
              )}
            </div>

            <div className="odp__cost-divider" />

            <div className="odp__cost-total">
              <span>সর্বমোট প্রদেয়</span>
              <strong>৳{fmtAmt(total)}</strong>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            FOOTER ACTIONS
        ══════════════════════════════════════════════════════════ */}
        <div className="odp__footer-actions">
          {isCancellable && (
            <button
              className="odp__footer-btn odp__footer-btn--cancel"
              onClick={handleCancel}
              disabled={cancelling}
            >
              <XCircle size={15} />
              {cancelling ? 'বাতিল হচ্ছে...' : 'অর্ডার বাতিল করুন'}
            </button>
          )}

          {isDelivered && (
            <button
              className="odp__footer-btn odp__footer-btn--reorder"
              onClick={handleReorder}
              disabled={reordering}
            >
              <RotateCcw size={15} />
              {reordering ? 'কার্টে যোগ হচ্ছে...' : 'আবার অর্ডার করুন'}
            </button>
          )}

          <Link to="/account/orders" className="odp__footer-btn odp__footer-btn--back">
            <ArrowLeft size={15} />
            সব অর্ডারে ফিরে যান
          </Link>
        </div>

      </div>
    </div>

    {/* ── Return request modal — portalled to <body> ── */}
    {returnModal && (
      <ReturnModal
        item={returnModal}
        onClose={() => setReturnModal(null)}
        onSuccess={(newReturn) => {
          setReturnMap((prev) => ({
            ...prev,
            [newReturn.order_item_id]: {
              return_status:  newReturn.status,   // 'initiated' from DB
              refund_status:  null,
              order_item_id:  newReturn.order_item_id,
            },
          }))
          setReturnModal(null)
        }}
      />
    )}
    </>
  )
}
