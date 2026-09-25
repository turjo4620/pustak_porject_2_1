import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './CheckoutPage.css'

// ── Bengali numeral helper ──────────────────────────────────────
const toBn = (n) =>
  String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

const formatBnAmount = (num) =>
  toBn(Number(num).toFixed(2))

// ── Delivery charge ─────────────────────────────────────────────
const DELIVERY_DHAKA   =  70
const DELIVERY_OUTSIDE = 120
const DHAKA_VARIANTS   = ['ঢাকা', 'dhaka', 'dhaka division', 'dhaka vibhag']

function isDhaka(value) {
  if (!value) return false
  return DHAKA_VARIANTS.includes(value.trim().toLowerCase())
}

function calcDeliveryCharge(addr) {
  // Check division first, fall back to district (handles both field patterns)
  if (isDhaka(addr?.division))  return DELIVERY_DHAKA
  if (isDhaka(addr?.district))  return DELIVERY_DHAKA
  if (isDhaka(addr?.city))      return DELIVERY_DHAKA
  return DELIVERY_OUTSIDE
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cartItems, totalCartPrice, removeFromCart, incrementItem, decrementItem, placeOrder, authUser } = useApp()

  const buyNow = location.state?.buyNow || null

  // ── Address state ──────────────────────────────────────────────
  const [addresses, setAddresses]         = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [addrForm, setAddrForm]           = useState({
    street: '', area: '', district: '', division: '', postal_code: '', is_default: false
  })
  const [addrSaving, setAddrSaving]       = useState(false)
  const [addrError, setAddrError]         = useState('')

  // ── Order state ────────────────────────────────────────────────
  const [placing, setPlacing]             = useState(false)
  const [error, setError]                 = useState('')
  const [couponInput, setCouponInput]     = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const displayItems = buyNow ? [buyNow] : cartItems
  const subtotal     = buyNow ? Number(buyNow.price_sold) * buyNow.quantity : totalCartPrice

  // Delivery charge — recalculates when selected address changes
  const selectedAddr   = addresses.find(x => x.address_id === selectedAddressId) || null
  const deliveryCharge = selectedAddr ? calcDeliveryCharge(selectedAddr) : 0
  const finalTotal     = Math.max(0, subtotal - discountAmount) + deliveryCharge

  // ── Fetch user's saved addresses ───────────────────────────────
  useEffect(() => {
    if (!authUser) return
    const token = localStorage.getItem('pustak-auth-token')
    fetch('https://putak-porject-2-1.onrender.com/api/addresses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setAddresses(list)
        const def = list.find(a => a.is_default) || list[0]
        if (def) setSelectedAddressId(def.address_id)
      })
      .catch(() => {})
  }, [authUser])

  // ── Save new address ───────────────────────────────────────────
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!addrForm.street.trim()) { setAddrError('রাস্তার ঠিকানা দিন'); return }
    setAddrError('')
    setAddrSaving(true)
    try {
      const token = localStorage.getItem('pustak-auth-token')
      const res = await fetch('https://putak-porject-2-1.onrender.com/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addrForm)
      })
      const saved = await res.json()
      if (!res.ok) throw new Error(saved.message || 'ঠিকানা সংরক্ষণ করা যায়নি')
      setAddresses(prev => {
        const updated = addrForm.is_default
          ? prev.map(a => ({ ...a, is_default: false }))
          : [...prev]
        return [...updated, saved]
      })
      setSelectedAddressId(saved.address_id)
      setShowAddForm(false)
      setAddrForm({ street: '', area: '', district: '', division: '', postal_code: '', is_default: false })
    } catch (err) {
      setAddrError(err.message)
    } finally {
      setAddrSaving(false)
    }
  }

  // ── Coupon ─────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponError('')
    setCouponLoading(true)
    try {
      const res = await fetch('https://putak-porject-2-1.onrender.com/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), orderSubtotal: subtotal }),
      })
      const data = await res.json()
      if (!data.success) {
        setCouponError(data.message); setCouponApplied(null); setDiscountAmount(0)
      } else {
        setCouponApplied(data.coupon); setDiscountAmount(data.discount_amount); setCouponError('')
      }
    } catch { setCouponError('কুপন যাচাই করতে সমস্যা হয়েছে') }
    finally { setCouponLoading(false) }
  }

  const handleRemoveCoupon = () => {
    setCouponApplied(null); setDiscountAmount(0); setCouponInput(''); setCouponError('')
  }

  // ── Place order ────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!authUser) { navigate('/login'); return }
    if (!selectedAddressId) { setError('অনুগ্রহ করে একটি ঠিকানা নির্বাচন করুন'); return }
    setError('')
    try {
      setPlacing(true)
      let order
      if (buyNow) {
        const token = localStorage.getItem('pustak-auth-token')
        const res = await fetch('https://putak-porject-2-1.onrender.com/api/orders/buy-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            bookId:         buyNow.book_id,
            quantity:        buyNow.quantity,
            addressId:       selectedAddressId,
            deliveryCharge,
            couponCode:      couponApplied?.code || null
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'অর্ডার দিতে সমস্যা হয়েছে')
        order = data
      } else {
        order = await placeOrder(selectedAddressId, couponApplied?.code || null, deliveryCharge)
      }
      navigate(`/payment/${order.order_id}`)
    } catch (err) {
      setError(err.message || 'অর্ডার দিতে সমস্যা হয়েছে')
    } finally {
      setPlacing(false)
    }
  }

  const isEmpty = displayItems.length === 0

  return (
    <div className="checkout-page">
      <div className="container">
        <p className="list-page__breadcrumb" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/">হোম</Link> › চেকআউট
        </p>
        <h1 className="checkout-page__title">অর্ডার নিশ্চিত করুন</h1>

        {error && <p className="checkout-page__error">{error}</p>}

        {isEmpty ? (
          <div className="checkout-page__empty">
            <p>কার্ট খালি। বই কিনতে হোমে ফিরুন।</p>
            <Link to="/" className="list-page__back-btn">হোমে ফিরুন</Link>
          </div>
        ) : (
          <div className="checkout-page__layout">

            {/* ── Left column ── */}
            <div className="checkout-page__left">

              {/* Items */}
              <div className="checkout-page__items">
                <h2>অর্ডার তালিকা ({toBn(displayItems.length)})</h2>
                {displayItems.map((b, idx) => (
                  <div key={b.cart_item_id || b.book_id || idx} className="checkout-item">
                    <img src={b.cover_image_url} alt={b.book_name} className="checkout-item__cover" />
                    <div className="checkout-item__info">
                      <strong><Link to={`/book/${b.book_id}`}>{b.book_name}</Link></strong>
                      {b.authors && <span>{b.authors}</span>}
                      <span className="checkout-item__price">৳{formatBnAmount(b.price_sold || b.locked_price)}</span>
                    </div>

                    {/* Quantity stepper */}
                    {!buyNow && (
                      <div className="checkout-item__stepper">
                        <button
                          className="checkout-item__stepper-btn"
                          onClick={() => decrementItem(b)}
                          aria-label="কমান"
                        >−</button>
                        <span className="checkout-item__stepper-qty">{toBn(b.quantity)}</span>
                        <button
                          className="checkout-item__stepper-btn"
                          onClick={() => incrementItem(b)}
                          aria-label="বাড়ান"
                        >+</button>
                      </div>
                    )}

                    {!buyNow && (
                      <button className="checkout-item__remove" onClick={() => removeFromCart(b.cart_item_id)} aria-label="সরান">✕</button>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Address section ── */}
              <div className="checkout-address">
                <h2>ডেলিভারি ঠিকানা</h2>

                {addresses.length > 0 && (
                  <div className="checkout-address__list">
                    {addresses.map(addr => (
                      <label
                        key={addr.address_id}
                        className={`checkout-address__option ${selectedAddressId === addr.address_id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.address_id}
                          checked={selectedAddressId === addr.address_id}
                          onChange={() => setSelectedAddressId(addr.address_id)}
                        />
                        <div className="checkout-address__text">
                          {/* Structured address preview */}
                          {authUser?.name && (
                            <div className="checkout-address__name">
                              {authUser.name}
                              {authUser.phone && <span className="checkout-address__phone"> · {authUser.phone}</span>}
                            </div>
                          )}
                          <div className="checkout-address__lines">
                            <span>{addr.street}</span>
                            {addr.area && <span>, {addr.area}</span>}
                            {addr.district && <span>, {addr.district}</span>}
                            {addr.division && <span>, {addr.division}</span>}
                            {addr.postal_code && <span> – {addr.postal_code}</span>}
                          </div>
                          {addr.is_default && <span className="checkout-address__default-badge">ডিফল্ট</span>}
                        </div>
                        <button
                          type="button"
                          className="checkout-address__edit-btn"
                          onClick={e => { e.preventDefault(); setShowAddForm(true) }}
                        >পরিবর্তন</button>
                      </label>
                    ))}
                  </div>
                )}

                {!showAddForm ? (
                  <button className="checkout-address__add-btn" onClick={() => setShowAddForm(true)}>
                    + নতুন ঠিকানা যোগ করুন
                  </button>
                ) : (
                  <form className="checkout-address__form" onSubmit={handleSaveAddress}>
                    <h3>নতুন ঠিকানা</h3>
                    {addrError && <p className="checkout-address__error">{addrError}</p>}

                    <div className="addr-field">
                      <label>রাস্তা / বাড়ি নম্বর *</label>
                      <input
                        type="text"
                        placeholder="যেমন: বাড়ি ৫, রাস্তা ১২, ধানমন্ডি"
                        value={addrForm.street}
                        onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="addr-row">
                      <div className="addr-field">
                        <label>এলাকা</label>
                        <input
                          type="text"
                          placeholder="এলাকা"
                          value={addrForm.area}
                          onChange={e => setAddrForm(p => ({ ...p, area: e.target.value }))}
                        />
                      </div>
                      <div className="addr-field">
                        <label>জেলা</label>
                        <input
                          type="text"
                          placeholder="জেলা"
                          value={addrForm.district}
                          onChange={e => setAddrForm(p => ({ ...p, district: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="addr-row">
                      <div className="addr-field">
                        <label>বিভাগ</label>
                        <input
                          type="text"
                          placeholder="বিভাগ"
                          value={addrForm.division}
                          onChange={e => setAddrForm(p => ({ ...p, division: e.target.value }))}
                        />
                      </div>
                      <div className="addr-field">
                        <label>পোস্টাল কোড</label>
                        <input
                          type="text"
                          placeholder="পোস্টাল কোড"
                          value={addrForm.postal_code}
                          onChange={e => setAddrForm(p => ({ ...p, postal_code: e.target.value }))}
                        />
                      </div>
                    </div>
                    <label className="addr-default-check">
                      <input
                        type="checkbox"
                        checked={addrForm.is_default}
                        onChange={e => setAddrForm(p => ({ ...p, is_default: e.target.checked }))}
                      />
                      ডিফল্ট ঠিকানা হিসেবে সংরক্ষণ করুন
                    </label>
                    <div className="addr-form-actions">
                      <button type="button" className="btn-secondary" onClick={() => { setShowAddForm(false); setAddrError('') }}>
                        বাতিল
                      </button>
                      <button type="submit" className="btn-primary" disabled={addrSaving}>
                        {addrSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ── Summary ── */}
            <div className="checkout-page__summary">
              <h2>অর্ডার সারসংক্ষেপ</h2>

              <div className="checkout-page__summary-row">
                <span>মোট বই</span>
                <span>{toBn(displayItems.length)}টি</span>
              </div>
              <div className="checkout-page__summary-row">
                <span>উপমোট</span>
                <span>৳{formatBnAmount(subtotal)}</span>
              </div>

              {!couponApplied ? (
                <div className="checkout-coupon">
                  <div className="checkout-coupon__row">
                    <input
                      type="text"
                      className="checkout-coupon__input"
                      placeholder="প্রোমো কোড লিখুন"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button className="checkout-coupon__btn" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                      {couponLoading ? '...' : 'প্রয়োগ'}
                    </button>
                  </div>
                  {couponError && <p className="checkout-coupon__error">{couponError}</p>}
                </div>
              ) : (
                <div className="checkout-coupon__applied">
                  <span>🎉 <strong>{couponApplied.code}</strong> — {couponApplied.description || `৳${formatBnAmount(couponApplied.discount_value)} ছাড়`}</span>
                  <button className="checkout-coupon__remove" onClick={handleRemoveCoupon}>সরান</button>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="checkout-page__summary-row checkout-page__summary-discount">
                  <span>ছাড়</span>
                  <span>− ৳{formatBnAmount(discountAmount)}</span>
                </div>
              )}

              <div className="checkout-page__summary-row">
                <span>ডেলিভারি চার্জ</span>
                <span className={deliveryCharge === DELIVERY_DHAKA ? '' : 'checkout-delivery__outside'}>
                  {!selectedAddr
                    ? <em style={{ color: '#9ca3af', fontSize: '0.85rem' }}>ঠিকানা বাছুন</em>
                    : `৳${deliveryCharge} (${deliveryCharge === DELIVERY_DHAKA ? 'ঢাকা বিভাগ' : 'ঢাকার বাইরে'})`
                  }
                </span>
              </div>

              <div className="checkout-page__summary-total">
                <strong>মোট</strong>
                <strong>৳{formatBnAmount(finalTotal)}</strong>
              </div>

              {!selectedAddressId && (
                <p className="checkout-page__addr-warn">⚠️ ঠিকানা নির্বাচন করুন</p>
              )}

              <button
                className="checkout-page__order-btn"
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId}
              >
                {placing ? 'অর্ডার দেওয়া হচ্ছে...' : 'পেমেন্টে এগিয়ে যান'}
              </button>
              <p className="checkout-page__note">
                বাংলাদেশের যেকোনো ঠিকানায় ৩-৫ কার্যদিবসে ডেলিভারি
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
