import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './BookCard.css'

// ── Bengali numeral helpers ──────────────────────────────────────
const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])
const fmtPrice = (n) => {
  const num = Number(n)
  // Drop trailing .00 for round numbers
  return toBn(Number.isInteger(num) ? String(num) : num.toFixed(2))
}

export default function BookCard({ book, size = 'default' }) {
  const navigate = useNavigate()
  const { addToCart, toggleWish, isWished, authUser } = useApp()
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  // ---------------------------------------------------------
  // DATABASE DATA MAPPING & FALLBACKS
  // ---------------------------------------------------------
  const bookId        = book.id
  const title         = book.book_name || book.title || 'শিরোনাম নেই'
  const cover         = book.cover_image_url || book.cover
  const author        = book.author || 'অজ্ঞাত'
  const rawPrice      = Number(book.price) || 0
  const discountPct   = Number(book.discount_percentage) || 0
  const category      = book.category || null
  const rating        = Number(book.rating) || 0
  const reviews       = Number(book.num_reviews) || Number(book.reviews) || 0
  const inStock       = book.in_stock != null
    ? Boolean(book.in_stock)
    : book.availability !== 'Out of Stock' && book.inStock !== false
  const badge         = book.badge || null
  const badgeColor    = book.badgeColor || '#000'

  // Discounted price: use pre-computed field from backend, or calculate from percentage
  const discountedPrice = discountPct > 0
    ? (Number(book.discount_price) || Math.round(rawPrice * (1 - discountPct / 100)))
    : null
  // What to show as the main (bold) price
  const displayPrice  = discountedPrice || rawPrice
  // Original price — only shown when there's a discount
  const originalPrice = discountedPrice ? rawPrice : null
  // ---------------------------------------------------------

  const wished = isWished(bookId)

  const handleCart = async (e) => {
    e.stopPropagation()
    if (!authUser) {
      navigate('/login')
      return
    }
    try {
      setAdding(true)
      await addToCart(book)
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    } catch (err) {
      alert(err.message || 'কার্টে যোগ করা যায়নি')
    } finally {
      setAdding(false)
    }
  }

  const handlePreview = (e) => {
    e.stopPropagation()
    navigate(`/book/${bookId}`)
  }

  const handleWish = (e) => {
    e.stopPropagation()
    toggleWish(book)
  }

  // Rating display: hide completely when no reviews
  const hasRating = rating > 0 && reviews > 0

  return (
    <article
      className={`book-card book-card--${size}`}
      aria-label={`${title} — ${author}`}
      onClick={() => navigate(`/book/${bookId}`)}
      role="button"
      tabIndex={0}
    >
      {/* Cover */}
      <div className="book-card__cover-wrap">
        <div className="book-card__cover">
          <img
            src={cover}
            alt={`${title} বইয়ের প্রচ্ছদ`}
            loading="lazy"
          />
          <div className="book-card__spine" aria-hidden="true" />
        </div>

        {/* Hover overlay */}
        <div className="book-card__overlay" aria-hidden="true">
          <button
            className="book-card__action"
            aria-label="প্রিভিউ দেখুন"
            onClick={handlePreview}
          >
            <Eye size={16} />
            দ্রুত দেখুন
          </button>
          <button
            className={`book-card__action book-card__action--cart ${added ? 'book-card__action--added' : ''}`}
            aria-label="কার্টে যোগ করুন"
            onClick={handleCart}
            disabled={adding}
          >
            <ShoppingBag size={16} />
            {added ? 'যোগ হয়েছে' : adding ? 'যোগ হচ্ছে...' : 'কার্ট যোগ'}
          </button>
        </div>

        {/* Badges */}
        {badge && (
          <span
            className="book-card__badge"
            style={{ background: badgeColor }}
            aria-label={`ব্যাজ: ${badge}`}
          >
            {badge}
          </span>
        )}
        {discountPct > 0 && (
          <span className="book-card__discount" aria-label={`${discountPct}% ছাড়`}>
            -{toBn(discountPct)}%
          </span>
        )}

        {/* Wishlist — top-right corner */}
        <button
          className={`book-card__wish ${wished ? 'book-card__wish--active' : ''}`}
          onClick={handleWish}
          aria-label={wished ? 'উইশলিস্ট থেকে সরান' : 'উইশলিস্টে যোগ করুন'}
          aria-pressed={wished}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Stock */}
        {!inStock && (
          <div className="book-card__out-of-stock" aria-label="স্টক নেই">স্টক নেই</div>
        )}
      </div>

      {/* Info */}
      <div className="book-card__info">
        {category && <span className="book-card__category">{category}</span>}
        <h3 className="book-card__title">{title}</h3>
        <p className="book-card__author">{author}</p>

        {/* Rating: show only when reviews exist */}
        {hasRating && (
          <div className="book-card__rating" aria-label={`রেটিং: ${rating} / ৫`}>
            <span className="book-card__stars" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={i < Math.floor(rating) ? 'star--filled' : 'star--empty'}
                />
              ))}
            </span>
            <span className="book-card__rating-num">{rating}</span>
            <span className="book-card__reviews">({toBn(reviews)})</span>
          </div>
        )}

        <div className="book-card__pricing">
          <strong className="book-card__price">৳{fmtPrice(displayPrice)}</strong>
          {originalPrice && (
            <s className="book-card__original">৳{fmtPrice(originalPrice)}</s>
          )}
        </div>
      </div>
    </article>
  )
}
