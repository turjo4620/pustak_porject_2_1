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
  shipped:    'পথে আছে',
  Shipped:    'পথে আছে',
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
        : returnRow.refund_status === 'Failed'
        ? ' · রিফান্ড ব্যর্থ'
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
function downloadInvoice(order, items, address, delivery) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = Number(item.line_total) || 0
    const unitPrice = Number(item.unit_price || item.price || 0)
    const quantity = Number(item.quantity) || 1
    return sum + (lineTotal || unitPrice * quantity)
  }, 0)
  const deliveryCharge = Number(delivery?.delivery_charge || order.delivery_charge || 120)
  const total = Number(order.total_amount || subtotal + deliveryCharge)
  const rows = items.map(item => `
    <tr>
      <td>${item.book_name}${item.author ? `<br><small>${item.author}</small>` : ''}</td>
      <td class="center">${item.quantity}</td>
      <td class="amount">৳${Number(item.unit_price || item.price || 0).toFixed(2)}</td>
      <td class="amount">৳${Number(item.line_total || (item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>`).join('')

  const addrLine = address
    ? [address.street, address.area, address.district, address.division, address.postal_code].filter(Boolean).join(', ')
    : 'Sylhet, Bangladesh'

  const html = `<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>ইনভয়েস — #${order.order_number}</title>
<style>
  :root{color:#17212b;background:#fff;font-family:"Noto Sans Bengali","Segoe UI",system-ui,sans-serif}
  *{box-sizing:border-box}
  body{margin:0;padding:40px 24px;background:#f3f5f7}
  .invoice{max-width:820px;margin:0 auto;padding:48px;background:#fff;box-shadow:0 12px 35px rgba(23,33,43,.09)}
  .header{display:flex;justify-content:space-between;gap:32px;padding-bottom:32px;border-bottom:3px solid #0f766e}
  .brand{color:#0f766e;font-size:1.55rem;font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
  .business-details,.meta{color:#53616d;font-size:.82rem;line-height:1.7}
  .meta{text-align:right}
  h1{margin:0 0 14px;color:#17212b;font-size:2.7rem;letter-spacing:.08em;line-height:1}
  .meta strong{color:#17212b}
  .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:30px 0}
  .party{padding:18px 20px;border:1px solid #d9e1e5;border-radius:6px;background:#f8fafb}
  .party h2{margin:0 0 10px;color:#0f766e;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase}
  .party p{margin:0;color:#33424d;font-size:.9rem;line-height:1.7}
  table{width:100%;border-collapse:collapse;font-size:.88rem}
  thead{background:#0f766e;color:#fff}
  th{padding:12px 14px;text-align:left;font-size:.76rem;letter-spacing:.05em;text-transform:uppercase}
  td{padding:14px;border:1px solid #d9e1e5;border-left:0;border-right:0;vertical-align:top}
  tbody tr:nth-child(even){background:#f8fafb}
  td small{color:#697782}
  .center{text-align:center}.amount{text-align:right;white-space:nowrap}
  tfoot td{padding:9px 14px;border:0;text-align:right}
  tfoot tr:first-child td{padding-top:18px}
  tfoot .total td{padding-top:14px;border-top:2px solid #0f766e;color:#0f766e;font-size:1.12rem;font-weight:800}
  .footer{display:flex;justify-content:space-between;gap:24px;margin-top:34px;padding-top:22px;border-top:1px solid #d9e1e5;color:#53616d;font-size:.8rem;line-height:1.65}
  .footer strong{color:#17212b}
  .thanks{color:#0f766e;font-size:1rem;font-weight:700}
  @media print{
    @page{size:A4;margin:14mm}
    body{padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .invoice{max-width:none;padding:0;box-shadow:none}
    .header,.party-grid,table,.footer{break-inside:avoid}
    thead{background:#0f766e!important;color:#fff!important}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
  @media(max-width:620px){body{padding:0}.invoice{padding:24px}.header,.footer{display:block}.meta{text-align:left;margin-top:24px}.party-grid{grid-template-columns:1fr}}
</style></head><body>
<main class="invoice">
<header class="header">
  <div>
    <div class="brand">📚 পুস্তক</div>
    <div class="business-details">Dhaka, Bangladesh<br>support@pustak.com<br>+880 1XXX-XXXXXX<br>Trade License / BIN: 123456789-0001</div>
  </div>
  <div class="meta"><h1>INVOICE</h1><strong>অর্ডার নম্বর:</strong> #${order.order_number}<br><strong>তারিখ:</strong> ${fmtDate(order.order_date)}</div>
</header>
<section class="party-grid">
  <div class="party"><h2>Bill To</h2><p><strong>Turjo Sarkar Prince</strong><br>Sylhet, Bangladesh<br>+880 1XXX-XXXXXX</p></div>
  <div class="party"><h2>Ship To</h2><p><strong>Turjo Sarkar Prince</strong><br>${addrLine}<br>+880 1XXX-XXXXXX</p></div>
</section>
<table>
  <thead><tr><th>বই</th><th style="text-align:center">পরিমাণ</th><th style="text-align:right">একক মূল্য</th><th style="text-align:right">মোট</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr><td colspan="3">Subtotal</td><td>৳${subtotal.toFixed(2)}</td></tr>
    <tr><td colspan="3">Delivery Charge</td><td>৳${deliveryCharge.toFixed(2)}</td></tr>
    <tr class="total"><td colspan="3">Grand Total</td><td>৳${total.toFixed(2)}</td></tr>
  </tfoot>
</table>
<footer class="footer">
  <div><div class="thanks">Thank you for your business.</div><strong>Payment Method:</strong> Cash on Delivery</div>
  <div><strong>Terms &amp; Conditions</strong><br>Goods once sold are non-refundable unless otherwise agreed.<br>Please retain this invoice for your records.</div>
</footer>
</main>
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
              onClick={() => downloadInvoice(order, items, address, delivery)}
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
