import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './CartPage.css'

// Delivery charge constants — must match CheckoutPage
const DELIVERY_DHAKA   = 70
const DELIVERY_OUTSIDE = 120

const toBn = (n) => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d])

export default function CartPage() {
  const navigate = useNavigate()
  const {
    cartItems, cartLoading, cartTotal,
    incrementItem, decrementItem, removeFromCart,
    authUser
  } = useApp()

  const [busyItemId, setBusyItemId] = useState(null)
  const [error, setError] = useState('')

  const guard = async (item, fn) => {
    try {
      setBusyItemId(item.cart_item_id)
      await fn()
    } catch (err) {
      setError(err.message || 'কিছু একটা সমস্যা হয়েছে')
    } finally {
      setBusyItemId(null)
    }
  }

  const handleIncrement = (item) => guard(item, () => incrementItem(item))
  const handleDecrement = (item) => guard(item, () => decrementItem(item))
  const handleRemove    = (item) => guard(item, () => removeFromCart(item.cart_item_id))

  const handleCheckout = () => {
    if (!authUser) { navigate('/login'); return }
    navigate('/checkout')
  }

  // Delivery range for display — show both rates before address is known
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="cart-page">
      <div className="container">
        <p className="list-page__breadcrumb" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/">হোম</Link> › কার্ট
        </p>
        <h1 className="cart-page__title">আপনার কার্ট</h1>

        {error && <p className="cart-page__error">{error}</p>}

        {cartLoading ? (
          <p>লোড হচ্ছে...</p>
        ) : cartItems.length === 0 ? (
          <div className="cart-page__empty">
            <p>কার্ট খালি। বই কিনতে হোমে ফিরুন।</p>
            <Link to="/" className="list-page__back-btn">হোমে ফিরুন</Link>
          </div>
        ) : (
          <div className="cart-page__layout">

            {/* ── Items ── */}
            <div className="cart-page__items">
              <h2>বইয়ের তালিকা ({toBn(cartItems.length)})</h2>

              {cartItems.map((item) => {
                const busy = busyItemId === item.cart_item_id
                return (
                  <div key={item.cart_item_id} className="cart-item">
                    <img
                      src={item.cover_image_url}
                      alt={item.book_name}
                      className="cart-item__cover"
                    />

                    <div className="cart-item__info">
                      <strong>
                        <Link to={`/book/${item.book_id}`}>{item.book_name}</Link>
                      </strong>
                      <span>{item.authors}</span>
                      <span className="cart-item__price">৳{item.locked_price}</span>
                    </div>

                    <div className="cart-item__qty">
                      <button onClick={() => handleDecrement(item)} disabled={busy} aria-label="পরিমাণ কমান">
                        <Minus size={14} />
                      </button>
                      <span className="cart-item__qty-value">{toBn(item.quantity)}</span>
                      <button onClick={() => handleIncrement(item)} disabled={busy} aria-label="পরিমাণ বাড়ান">
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="cart-item__subtotal">
                      ৳{(item.locked_price * item.quantity).toFixed(2)}
                    </div>

                    <button
                      className="cart-item__remove"
                      onClick={() => handleRemove(item)}
                      disabled={busy}
                      aria-label="মুছে ফেলুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* ── Summary ── */}
            <div className="cart-page__summary">
              <h2>অর্ডার সারসংক্ষেপ</h2>

              <div className="cart-page__summary-row">
                <span>মোট বই</span>
                <span>{toBn(totalItems)}টি</span>
              </div>

              <div className="cart-page__summary-row">
                <span>উপমোট</span>
                <span>৳{cartTotal.toFixed(2)}</span>
              </div>

              <div className="cart-page__summary-row cart-page__delivery-row">
                <span className="cart-page__delivery-label">
                  ডেলিভারি চার্জ
                  <span className="cart-page__delivery-tip" title="ঢাকা বিভাগ: ৭০ টাকা | ঢাকার বাইরে: ১২০ টাকা">
                    <Info size={13} />
                  </span>
                </span>
                <span className="cart-page__delivery-value">
                  <span className="cart-page__delivery-dhaka">ঢাকা: ৳{toBn(DELIVERY_DHAKA)}</span>
                  <span className="cart-page__delivery-sep"> / </span>
                  <span className="cart-page__delivery-outside">বাইরে: ৳{toBn(DELIVERY_OUTSIDE)}</span>
                </span>
              </div>

              <div className="cart-page__delivery-note">
                <Info size={12} />
                চেকআউটে ঠিকানা দেওয়ার পর সঠিক চার্জ যোগ হবে
              </div>

              <div className="cart-page__summary-divider" />

              <button
                className="cart-page__order-btn"
                onClick={handleCheckout}
              >
                চেকআউটে যান →
              </button>

              <p className="cart-page__note">
                বাংলাদেশের যেকোনো ঠিকানায় ৩-৫ কার্যদিবসে ডেলিভারি
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
