import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './CheckoutPage.css'

// â”€â”€ Bengali numeral helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const toBn = (n) =>
  String(n).replace(/[0-9]/g, (d) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])

const formatBnAmount = (num) =>
  toBn(Number(num).toFixed(2))

// â”€â”€ Delivery charge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DELIVERY_DHAKA   =  70
const DELIVERY_OUTSIDE = 120
const DHAKA_VARIANTS   = ['à¦¢à¦¾à¦•à¦¾', 'dhaka', 'dhaka division', 'dhaka vibhag']

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

  // â”€â”€ Address state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [addresses, setAddresses]         = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [addrForm, setAddrForm]           = useState({
    street: '', area: '', district: '', division: '', postal_code: '', is_default: false
  })
  const [addrSaving, setAddrSaving]       = useState(false)
  const [addrError, setAddrError]         = useState('')

  // â”€â”€ Order state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [placing, setPlacing]             = useState(false)
  const [error, setError]                 = useState('')
  const [couponInput, setCouponInput]     = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const displayItems = buyNow ? [buyNow] : cartItems
  const subtotal     = buyNow ? Number(buyNow.price_sold) * buyNow.quantity : totalCartPrice

  // Delivery charge â€” recalculates when selected address changes
  const selectedAddr   = addresses.find(x => x.address_id === selectedAddressId) || null
  const deliveryCharge = selectedAddr ? calcDeliveryCharge(selectedAddr) : 0
  const finalTotal     = Math.max(0, subtotal - discountAmount) + deliveryCharge

  // â”€â”€ Fetch user's saved addresses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Save new address â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!addrForm.street.trim()) { setAddrError('à¦°à¦¾à¦¸à§à¦¤à¦¾à¦° à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¦à¦¿à¦¨'); return }
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
      if (!res.ok) throw new Error(saved.message || 'à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿')
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

  // â”€â”€ Coupon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    } catch { setCouponError('à¦•à§à¦ªà¦¨ à¦¯à¦¾à¦šà¦¾à¦‡ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡') }
    finally { setCouponLoading(false) }
  }

  const handleRemoveCoupon = () => {
    setCouponApplied(null); setDiscountAmount(0); setCouponInput(''); setCouponError('')
  }

  // â”€â”€ Place order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePlaceOrder = async () => {
    if (!authUser) { navigate('/login'); return }
    if (!selectedAddressId) { setError('à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦à¦•à¦Ÿà¦¿ à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨'); return }
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
        if (!res.ok) throw new Error(data.message || 'à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡')
        order = data
      } else {
        order = await placeOrder(selectedAddressId, couponApplied?.code || null, deliveryCharge)
      }
      navigate(`/payment/${order.order_id}`)
    } catch (err) {
      setError(err.message || 'à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡')
    } finally {
      setPlacing(false)
    }
  }

  const isEmpty = displayItems.length === 0

  return (
    <div className="checkout-page">
      <div className="container">
        <p className="list-page__breadcrumb" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/">à¦¹à§‹à¦®</Link> â€º à¦šà§‡à¦•à¦†à¦‰à¦Ÿ
        </p>
        <h1 className="checkout-page__title">à¦…à¦°à§à¦¡à¦¾à¦° à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤ à¦•à¦°à§à¦¨</h1>

        {error && <p className="checkout-page__error">{error}</p>}

        {isEmpty ? (
          <div className="checkout-page__empty">
            <p>à¦•à¦¾à¦°à§à¦Ÿ à¦–à¦¾à¦²à¦¿à¥¤ à¦¬à¦‡ à¦•à¦¿à¦¨à¦¤à§‡ à¦¹à§‹à¦®à§‡ à¦«à¦¿à¦°à§à¦¨à¥¤</p>
            <Link to="/" className="list-page__back-btn">à¦¹à§‹à¦®à§‡ à¦«à¦¿à¦°à§à¦¨</Link>
          </div>
        ) : (
          <div className="checkout-page__layout">

            {/* â”€â”€ Left column â”€â”€ */}
            <div className="checkout-page__left">

              {/* Items */}
              <div className="checkout-page__items">
                <h2>à¦…à¦°à§à¦¡à¦¾à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾ ({toBn(displayItems.length)})</h2>
                {displayItems.map((b, idx) => (
                  <div key={b.cart_item_id || b.book_id || idx} className="checkout-item">
                    <img src={b.cover_image_url} alt={b.book_name} className="checkout-item__cover" />
                    <div className="checkout-item__info">
                      <strong><Link to={`/book/${b.book_id}`}>{b.book_name}</Link></strong>
                      {b.authors && <span>{b.authors}</span>}
                      <span className="checkout-item__price">à§³{formatBnAmount(b.price_sold || b.locked_price)}</span>
                    </div>

                    {/* Quantity stepper */}
                    {!buyNow && (
                      <div className="checkout-item__stepper">
                        <button
                          className="checkout-item__stepper-btn"
                          onClick={() => decrementItem(b)}
                          aria-label="à¦•à¦®à¦¾à¦¨"
                        >âˆ’</button>
                        <span className="checkout-item__stepper-qty">{toBn(b.quantity)}</span>
                        <button
                          className="checkout-item__stepper-btn"
                          onClick={() => incrementItem(b)}
                          aria-label="à¦¬à¦¾à¦¡à¦¼à¦¾à¦¨"
                        >+</button>
                      </div>
                    )}

                    {!buyNow && (
                      <button className="checkout-item__remove" onClick={() => removeFromCart(b.cart_item_id)} aria-label="à¦¸à¦°à¦¾à¦¨">âœ•</button>
                    )}
                  </div>
                ))}
              </div>

              {/* â”€â”€ Address section â”€â”€ */}
              <div className="checkout-address">
                <h2>à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦ à¦¿à¦•à¦¾à¦¨à¦¾</h2>

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
                              {authUser.phone && <span className="checkout-address__phone"> Â· {authUser.phone}</span>}
                            </div>
                          )}
                          <div className="checkout-address__lines">
                            <span>{addr.street}</span>
                            {addr.area && <span>, {addr.area}</span>}
                            {addr.district && <span>, {addr.district}</span>}
                            {addr.division && <span>, {addr.division}</span>}
                            {addr.postal_code && <span> â€“ {addr.postal_code}</span>}
                          </div>
                          {addr.is_default && <span className="checkout-address__default-badge">à¦¡à¦¿à¦«à¦²à§à¦Ÿ</span>}
                        </div>
                        <button
                          type="button"
                          className="checkout-address__edit-btn"
                          onClick={e => { e.preventDefault(); setShowAddForm(true) }}
                        >à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨</button>
                      </label>
                    ))}
                  </div>
                )}

                {!showAddForm ? (
                  <button className="checkout-address__add-btn" onClick={() => setShowAddForm(true)}>
                    + à¦¨à¦¤à§à¦¨ à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¯à§‹à¦— à¦•à¦°à§à¦¨
                  </button>
                ) : (
                  <form className="checkout-address__form" onSubmit={handleSaveAddress}>
                    <h3>à¦¨à¦¤à§à¦¨ à¦ à¦¿à¦•à¦¾à¦¨à¦¾</h3>
                    {addrError && <p className="checkout-address__error">{addrError}</p>}

                    <div className="addr-field">
                      <label>à¦°à¦¾à¦¸à§à¦¤à¦¾ / à¦¬à¦¾à¦¡à¦¼à¦¿ à¦¨à¦®à§à¦¬à¦° *</label>
                      <input
                        type="text"
                        placeholder="à¦¯à§‡à¦®à¦¨: à¦¬à¦¾à¦¡à¦¼à¦¿ à§«, à¦°à¦¾à¦¸à§à¦¤à¦¾ à§§à§¨, à¦§à¦¾à¦¨à¦®à¦¨à§à¦¡à¦¿"
                        value={addrForm.street}
                        onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="addr-row">
                      <div className="addr-field">
                        <label>à¦à¦²à¦¾à¦•à¦¾</label>
                        <input
                          type="text"
                          placeholder="à¦à¦²à¦¾à¦•à¦¾"
                          value={addrForm.area}
                          onChange={e => setAddrForm(p => ({ ...p, area: e.target.value }))}
                        />
                      </div>
                      <div className="addr-field">
                        <label>à¦œà§‡à¦²à¦¾</label>
                        <input
                          type="text"
                          placeholder="à¦œà§‡à¦²à¦¾"
                          value={addrForm.district}
                          onChange={e => setAddrForm(p => ({ ...p, district: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="addr-row">
                      <div className="addr-field">
                        <label>à¦¬à¦¿à¦­à¦¾à¦—</label>
                        <input
                          type="text"
                          placeholder="à¦¬à¦¿à¦­à¦¾à¦—"
                          value={addrForm.division}
                          onChange={e => setAddrForm(p => ({ ...p, division: e.target.value }))}
                        />
                      </div>
                      <div className="addr-field">
                        <label>à¦ªà§‹à¦¸à§à¦Ÿà¦¾à¦² à¦•à§‹à¦¡</label>
                        <input
                          type="text"
                          placeholder="à¦ªà§‹à¦¸à§à¦Ÿà¦¾à¦² à¦•à§‹à¦¡"
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
                      à¦¡à¦¿à¦«à¦²à§à¦Ÿ à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¹à¦¿à¦¸à§‡à¦¬à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à§à¦¨
                    </label>
                    <div className="addr-form-actions">
                      <button type="button" className="btn-secondary" onClick={() => { setShowAddForm(false); setAddrError('') }}>
                        à¦¬à¦¾à¦¤à¦¿à¦²
                      </button>
                      <button type="submit" className="btn-primary" disabled={addrSaving}>
                        {addrSaving ? 'à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦¹à¦šà§à¦›à§‡...' : 'à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à§à¦¨'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* â”€â”€ Summary â”€â”€ */}
            <div className="checkout-page__summary">
              <h2>à¦…à¦°à§à¦¡à¦¾à¦° à¦¸à¦¾à¦°à¦¸à¦‚à¦•à§à¦·à§‡à¦ª</h2>

              <div className="checkout-page__summary-row">
                <span>à¦®à§‹à¦Ÿ à¦¬à¦‡</span>
                <span>{toBn(displayItems.length)}à¦Ÿà¦¿</span>
              </div>
              <div className="checkout-page__summary-row">
                <span>à¦‰à¦ªà¦®à§‹à¦Ÿ</span>
                <span>à§³{formatBnAmount(subtotal)}</span>
              </div>

              {!couponApplied ? (
                <div className="checkout-coupon">
                  <div className="checkout-coupon__row">
                    <input
                      type="text"
                      className="checkout-coupon__input"
                      placeholder="à¦ªà§à¦°à§‹à¦®à§‹ à¦•à§‹à¦¡ à¦²à¦¿à¦–à§à¦¨"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button className="checkout-coupon__btn" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                      {couponLoading ? '...' : 'à¦ªà§à¦°à¦¯à¦¼à§‹à¦—'}
                    </button>
                  </div>
                  {couponError && <p className="checkout-coupon__error">{couponError}</p>}
                </div>
              ) : (
                <div className="checkout-coupon__applied">
                  <span>ðŸŽ‰ <strong>{couponApplied.code}</strong> â€” {couponApplied.description || `à§³${formatBnAmount(couponApplied.discount_value)} à¦›à¦¾à¦¡à¦¼`}</span>
                  <button className="checkout-coupon__remove" onClick={handleRemoveCoupon}>à¦¸à¦°à¦¾à¦¨</button>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="checkout-page__summary-row checkout-page__summary-discount">
                  <span>à¦›à¦¾à¦¡à¦¼</span>
                  <span>âˆ’ à§³{formatBnAmount(discountAmount)}</span>
                </div>
              )}

              <div className="checkout-page__summary-row">
                <span>à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦šà¦¾à¦°à§à¦œ</span>
                <span className={deliveryCharge === DELIVERY_DHAKA ? '' : 'checkout-delivery__outside'}>
                  {!selectedAddr
                    ? <em style={{ color: '#9ca3af', fontSize: '0.85rem' }}>à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¬à¦¾à¦›à§à¦¨</em>
                    : `à§³${deliveryCharge} (${deliveryCharge === DELIVERY_DHAKA ? 'à¦¢à¦¾à¦•à¦¾ à¦¬à¦¿à¦­à¦¾à¦—' : 'à¦¢à¦¾à¦•à¦¾à¦° à¦¬à¦¾à¦‡à¦°à§‡'})`
                  }
                </span>
              </div>

              <div className="checkout-page__summary-total">
                <strong>à¦®à§‹à¦Ÿ</strong>
                <strong>à§³{formatBnAmount(finalTotal)}</strong>
              </div>

              {!selectedAddressId && (
                <p className="checkout-page__addr-warn">âš ï¸ à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨</p>
              )}

              <button
                className="checkout-page__order-btn"
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId}
              >
                {placing ? 'à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à§‡à¦“à¦¯à¦¼à¦¾ à¦¹à¦šà§à¦›à§‡...' : 'à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿà§‡ à¦à¦—à¦¿à¦¯à¦¼à§‡ à¦¯à¦¾à¦¨'}
              </button>
              <p className="checkout-page__note">
                à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶à§‡à¦° à¦¯à§‡à¦•à§‹à¦¨à§‹ à¦ à¦¿à¦•à¦¾à¦¨à¦¾à¦¯à¦¼ à§©-à§« à¦•à¦¾à¦°à§à¦¯à¦¦à¦¿à¦¬à¦¸à§‡ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

