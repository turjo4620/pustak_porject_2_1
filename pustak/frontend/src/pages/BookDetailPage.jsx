import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, Heart, ShoppingBag, Star, Share2, Check,
  Send, Trash2, BadgeCheck, RotateCcw, Truck,
  ChevronDown, ChevronUp, X, ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api/http'
import './BookDetailPage.css'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtBn = (n) => String(n).replace(/[0-9]/g, (d) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])

function StarDisplay({ rating, size = 16 }) {
  return (
    <span className="pdp-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n} size={size}
          fill={n <= Math.round(rating) ? '#e8a020' : 'none'}
          stroke={n <= Math.round(rating) ? '#e8a020' : '#d1d5db'}
        />
      ))}
    </span>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 1. PRODUCT MEDIA  (left column)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductMedia({ book, wished, onWish, onShare, copied, discountPct }) {
  const coverUrl = book.cover_image_url
    ? book.cover_image_url.replace('w=300&h=420', 'w=600&h=840')
    : ''

  return (
    <div className="pdp-media">
      {/* Cover */}
      <div className="pdp-media__cover-wrap">
        {discountPct && (
          <span className="pdp-media__discount-pill">{discountPct} à¦›à¦¾à¦¡à¦¼</span>
        )}
        <div className="pdp-media__cover">
          <img src={coverUrl} alt={`${book.book_name} à¦¬à¦‡à¦¯à¦¼à§‡à¦° à¦ªà§à¦°à¦šà§à¦›à¦¦`} />
          <div className="pdp-media__spine" aria-hidden="true" />
        </div>
      </div>

      {/* Wish + Share */}
      <div className="pdp-media__actions">
        <button
          className={`pdp-media__action-btn ${wished ? 'pdp-media__action-btn--wished' : ''}`}
          onClick={onWish}
          aria-label={wished ? 'à¦‰à¦‡à¦¶à¦²à¦¿à¦¸à§à¦Ÿ à¦¥à§‡à¦•à§‡ à¦¸à¦°à¦¾à¦¨' : 'à¦‰à¦‡à¦¶à¦²à¦¿à¦¸à§à¦Ÿà§‡ à¦¯à§‹à¦— à¦•à¦°à§à¦¨'}
          aria-pressed={wished}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
          {wished ? 'à¦¸à¦‚à¦°à¦•à§à¦·à¦¿à¦¤' : 'à¦‰à¦‡à¦¶à¦²à¦¿à¦¸à§à¦Ÿ'}
        </button>
        <button
          className="pdp-media__action-btn"
          onClick={onShare}
          aria-label="à¦²à¦¿à¦™à§à¦• à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨"
        >
          {copied ? <Check size={15} /> : <Share2 size={15} />}
          {copied ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'à¦¶à§‡à¦¯à¦¼à¦¾à¦°'}
        </button>
      </div>

      {/* Trust badges */}
      <div className="pdp-trust">
        <div className="pdp-trust__item">
          <ShieldCheck size={17} className="pdp-trust__icon pdp-trust__icon--green" />
          <span>à§§à§¦à§¦% à¦…à¦°à¦¿à¦œà¦¿à¦¨à¦¾à¦² à¦¬à¦‡ à¦—à§à¦¯à¦¾à¦°à¦¾à¦¨à§à¦Ÿà¦¿</span>
        </div>
        <div className="pdp-trust__item">
          <RotateCcw size={17} className="pdp-trust__icon pdp-trust__icon--blue" />
          <span>à§­ à¦¦à¦¿à¦¨à§‡à¦° à¦°à¦¿à¦Ÿà¦¾à¦°à§à¦¨ à¦ªà¦²à¦¿à¦¸à¦¿</span>
        </div>
        <div className="pdp-trust__item">
          <Truck size={17} className="pdp-trust__icon pdp-trust__icon--orange" />
          <span>à¦•à§à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦¸à§à¦¬à¦¿à¦§à¦¾</span>
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 2. METADATA GRID
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MetadataGrid({ language, numPages, edition, isbn }) {
  const items = [
    { label: 'à¦­à¦¾à¦·à¦¾',      value: language },
    { label: 'à¦ªà§ƒà¦·à§à¦ à¦¾à¦¸à¦‚à¦–à§à¦¯à¦¾', value: numPages },
    { label: 'à¦¸à¦‚à¦¸à§à¦•à¦°à¦£',   value: edition  },
    { label: 'ISBN',      value: isbn     },
  ]
  return (
    <div className="pdp-meta-grid" role="list">
      {items.map(({ label, value }) => (
        <div key={label} className="pdp-meta-grid__item" role="listitem">
          <span className="pdp-meta-grid__label">{label}</span>
          <strong className="pdp-meta-grid__value">{value}</strong>
        </div>
      ))}
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 3. PURCHASE ACTIONS  (quantity + add-to-cart + buy-now)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PurchaseActions({
  inStock, qty, onQtyChange,
  inCart, added, adding, onCart,
  onBuyNow,
}) {
  return (
    <div className="pdp-purchase">
      <div className="pdp-purchase__row">
        {/* Qty stepper */}
        <div className="pdp-qty" role="group" aria-label="à¦ªà¦°à¦¿à¦®à¦¾à¦£">
          <button
            className="pdp-qty__btn"
            onClick={() => onQtyChange(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="à¦•à¦®à¦¾à¦¨"
          >âˆ’</button>
          <span className="pdp-qty__count" aria-live="polite">{qty}</span>
          <button
            className="pdp-qty__btn"
            onClick={() => onQtyChange(qty + 1)}
            aria-label="à¦¬à¦¾à¦¡à¦¼à¦¾à¦¨"
          >+</button>
        </div>

        {/* Add to cart */}
        <button
          className={`pdp-cart-btn ${inCart ? 'pdp-cart-btn--in' : ''} ${added ? 'pdp-cart-btn--added' : ''}`}
          onClick={onCart}
          disabled={!inStock || adding}
          aria-label="à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦¯à§‹à¦— à¦•à¦°à§à¦¨"
        >
          <ShoppingBag size={18} />
          {added ? 'à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦¯à§‹à¦— à¦¹à¦¯à¦¼à§‡à¦›à§‡' : adding ? 'à¦¯à§‹à¦— à¦¹à¦šà§à¦›à§‡...' : inCart ? 'à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦†à¦›à§‡' : 'à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦¯à§‹à¦— à¦•à¦°à§à¦¨'}
        </button>
      </div>

      {/* Buy now */}
      <button
        className="pdp-buy-now-btn"
        disabled={!inStock}
        onClick={onBuyNow}
      >
        à¦à¦–à¦¨à¦‡ à¦•à¦¿à¦¨à§à¦¨
      </button>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 4. PRODUCT INFO  (center column)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductInfo({
  book, category, publisher, publicationId,
  rating_avg, num_reviews, reviewSectionRef,
  currentPrice, originalPrice, discountPct,
  inStock, qty, onQtyChange, inCart, added, adding, onCart, onBuyNow,
  cartError,
}) {
  const [expanded, setExpanded] = useState(false)
  const description = (book.description || 'à¦à¦‡ à¦¬à¦‡à¦Ÿà¦¿à¦° à¦•à§‹à¦¨à§‹ à¦¬à¦¿à¦¬à¦°à¦£ à¦¦à§‡à¦“à¦¯à¦¼à¦¾ à¦¨à§‡à¦‡à¥¤')
    .replace(/show more/gi, '').replace(/à¦†à¦°à§‹ à¦ªà¦¡à¦¼à§à¦¨/g, '').replace(/à¦†à¦°à¦“ à¦¦à§‡à¦–à§à¦¨/g, '').trim()
  const SHORT_LIMIT = 280
  const isLong = description.length > SHORT_LIMIT

  const language = book.language  || 'à¦¬à¦¾à¦‚à¦²à¦¾'
  const numPages = book.num_pages  || 'â€”'
  const edition  = book.edition    || 'à§§à¦®'
  const isbn     = book.isbn       || 'â€”'

  const scrollToReviews = () => {
    reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pdp-info">
      {/* Breadcrumb */}
      <nav className="pdp-breadcrumb" aria-label="à¦ªà¦¥ à¦šà¦¿à¦¹à§à¦¨">
        <Link to="/">à¦¹à§‹à¦®</Link>
        <span aria-hidden="true">â€º</span>
        {book.category_id
          ? <Link to={`/category/${book.category_id}`}>{category}</Link>
          : <span>{category}</span>}
        <span aria-hidden="true">â€º</span>
        <span aria-current="page">{book.book_name}</span>
      </nav>

      {/* Title */}
      <h1 className="pdp-title">{book.book_name}</h1>

      {/* Author + publisher */}
      <p className="pdp-author">
        à¦²à§‡à¦–à¦•:{' '}
        {book.authors?.length > 0
          ? book.authors.map((a, i) => (
              <span key={a.author_id}>
                <Link to={`/author/${a.author_id}`} className="pdp-link">{a.name}</Link>
                {i < book.authors.length - 1 && ', '}
              </span>
            ))
          : <span className="pdp-link">{book.author || 'à¦…à¦œà§à¦žà¦¾à¦¤'}</span>
        }
      </p>
      <p className="pdp-publisher">
        à¦ªà§à¦°à¦•à¦¾à¦¶à¦•:{' '}
        {publicationId
          ? <Link to={`/publisher/${publicationId}`} className="pdp-link--muted"><strong>{publisher}</strong></Link>
          : <strong>{publisher}</strong>
        }
      </p>

      {/* Rating anchor */}
      <div className="pdp-rating-row">
        <StarDisplay rating={rating_avg} />
        <span className="pdp-rating-row__score">{Number(rating_avg).toFixed(1)}</span>
        <button
          className="pdp-rating-row__count"
          onClick={scrollToReviews}
          aria-label={`${num_reviews} à¦Ÿà¦¿ à¦°à¦¿à¦­à¦¿à¦‰ à¦¦à§‡à¦–à§à¦¨`}
        >
          {fmtBn(num_reviews)} à¦Ÿà¦¿ à¦°à¦¿à¦­à¦¿à¦‰
        </button>
        <span className="pdp-rating-row__sep">Â·</span>
        <button className="pdp-rating-row__write" onClick={scrollToReviews}>
          à¦°à¦¿à¦­à¦¿à¦‰ à¦²à¦¿à¦–à§à¦¨
        </button>
      </div>

      {/* Price block */}
      <div className="pdp-price-block">
        <strong className="pdp-price-block__current">à§³{currentPrice}</strong>
        {originalPrice && (
          <>
            <s className="pdp-price-block__original">à§³{originalPrice}</s>
            {discountPct && <span className="pdp-price-block__badge">{discountPct} à¦›à¦¾à¦¡à¦¼</span>}
          </>
        )}
      </div>

      {/* Stock */}
      <span className={`pdp-stock ${inStock ? 'pdp-stock--in' : 'pdp-stock--out'}`}>
        <span className="pdp-stock__dot" />
        {inStock ? 'à¦¸à§à¦Ÿà¦•à§‡ à¦†à¦›à§‡' : 'à¦¸à§à¦Ÿà¦• à¦¨à§‡à¦‡'}
      </span>

      {/* Purchase actions */}
      <PurchaseActions
        inStock={inStock} qty={qty} onQtyChange={onQtyChange}
        inCart={inCart} added={added} adding={adding}
        onCart={onCart} onBuyNow={onBuyNow}
      />

      {cartError && <p className="pdp-cart-error">{cartError}</p>}

      {/* Metadata grid */}
      <MetadataGrid
        language={language} numPages={numPages}
        edition={edition} isbn={isbn}
      />

      {/* Description */}
      <div className="pdp-desc">
        <h3 className="pdp-desc__title">à¦¬à¦‡ à¦¸à¦®à§à¦ªà¦°à§à¦•à§‡</h3>
        <p className="pdp-desc__body">
          {isLong && !expanded
            ? description.slice(0, SHORT_LIMIT) + 'â€¦'
            : description}
        </p>
        {isLong && (
          <button
            className="pdp-desc__toggle"
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
          >
            {expanded
              ? <><ChevronUp size={14} /> à¦•à¦® à¦¦à§‡à¦–à§à¦¨</>
              : <><ChevronDown size={14} /> à¦†à¦°à¦“ à¦ªà¦¡à¦¼à§à¦¨</>
            }
          </button>
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 5. STAR PICKER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'à¦–à§à¦¬ à¦–à¦¾à¦°à¦¾à¦ª', 'à¦–à¦¾à¦°à¦¾à¦ª', 'à¦ à¦¿à¦•à¦ à¦¾à¦•', 'à¦­à¦¾à¦²à§‹', 'à¦…à¦¸à¦¾à¦§à¦¾à¦°à¦£']
  return (
    <div className="pdp-star-picker">
      <div className="pdp-star-picker__stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button"
            className={`pdp-star-picker__btn ${n <= (hovered || value) ? 'pdp-star-picker__btn--on' : ''}`}
            onClick={() => !disabled && onChange(n)}
            onMouseEnter={() => !disabled && setHovered(n)}
            onMouseLeave={() => !disabled && setHovered(0)}
            aria-label={`${n} à¦¤à¦¾à¦°à¦¾`}
            disabled={disabled}
          >
            <Star size={28}
              fill={n <= (hovered || value) ? '#e8a020' : 'none'}
              stroke={n <= (hovered || value) ? '#e8a020' : '#d1d5db'}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="pdp-star-picker__hint">{labels[hovered || value]}</span>
      )}
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 6. REVIEW MODAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReviewModal({ myReview, onClose, onSubmit, onDelete, submitting }) {
  const [rating,  setRating]  = useState(myReview?.rating  || 0)
  const [comment, setComment] = useState(myReview?.comment || '')
  const [error,   setError]   = useState('')

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!rating) { setError('à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦à¦•à¦Ÿà¦¿ à¦°à§‡à¦Ÿà¦¿à¦‚ à¦¦à¦¿à¦¨à¥¤'); return }
    setError('')
    onSubmit(rating, comment)
  }

  return (
    <div
      className="pdp-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-label="à¦°à¦¿à¦­à¦¿à¦‰ à¦²à¦¿à¦–à§à¦¨"
    >
      <div className="pdp-modal">
        <div className="pdp-modal__header">
          <h2 className="pdp-modal__title">
            {myReview ? 'à¦°à¦¿à¦­à¦¿à¦‰ à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾ à¦•à¦°à§à¦¨' : 'à¦à¦•à¦Ÿà¦¿ à¦°à¦¿à¦­à¦¿à¦‰ à¦²à¦¿à¦–à§à¦¨'}
          </h2>
          <button className="pdp-modal__close" onClick={onClose} aria-label="à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨">
            <X size={18} />
          </button>
        </div>

        <form className="pdp-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="pdp-modal__field">
            <label className="pdp-modal__label">à¦°à§‡à¦Ÿà¦¿à¦‚ <span aria-hidden="true">*</span></label>
            <StarPicker value={rating} onChange={setRating} disabled={submitting} />
          </div>

          <div className="pdp-modal__field">
            <label className="pdp-modal__label" htmlFor="review-comment">
              à¦†à¦ªà¦¨à¦¾à¦° à¦®à¦¤à¦¾à¦®à¦¤ <span className="pdp-modal__optional">(à¦à¦šà§à¦›à¦¿à¦•)</span>
            </label>
            <textarea
              id="review-comment"
              className="pdp-modal__textarea"
              rows={5}
              placeholder="à¦¬à¦‡à¦Ÿà¦¿ à¦¸à¦®à§à¦ªà¦°à§à¦•à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦…à¦¨à§à¦­à§‚à¦¤à¦¿ à¦¶à§‡à¦¯à¦¼à¦¾à¦° à¦•à¦°à§à¦¨..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              disabled={submitting}
            />
            <span className="pdp-modal__char">{comment.length}/à§§à§¦à§¦à§¦</span>
          </div>

          {error && <p className="pdp-modal__error" role="alert">{error}</p>}

          <div className="pdp-modal__actions">
            <button type="button" className="pdp-modal__cancel" onClick={onClose} disabled={submitting}>
              à¦¬à¦¾à¦¤à¦¿à¦²
            </button>
            {myReview && (
              <button
                type="button" className="pdp-modal__delete"
                onClick={onDelete} disabled={submitting}
              >
                <Trash2 size={14} /> à¦®à§à¦›à§à¦¨
              </button>
            )}
            <button
              type="submit" className="pdp-modal__submit"
              disabled={submitting || !rating}
            >
              <Send size={14} />
              {submitting ? 'à¦œà¦®à¦¾ à¦¹à¦šà§à¦›à§‡...' : myReview ? 'à¦†à¦ªà¦¡à§‡à¦Ÿ' : 'à¦œà¦®à¦¾ à¦¦à¦¿à¦¨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 7. REVIEW SECTION  (right / bottom)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SORT_OPTIONS = [
  { value: 'recent',  label: 'à¦¸à¦¾à¦®à§à¦ªà§à¦°à¦¤à¦¿à¦•'      },
  { value: 'highest', label: 'à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦°à§‡à¦Ÿà¦¿à¦‚' },
  { value: 'lowest',  label: 'à¦¸à¦°à§à¦¬à¦¨à¦¿à¦®à§à¦¨ à¦°à§‡à¦Ÿà¦¿à¦‚' },
]

function ReviewSection({
  reviews, reviewsLoading, myReview,
  rating_avg, num_reviews,
  authUser, onOpenModal,
  sectionRef,
}) {
  const [sort,     setSort]     = useState('recent')
  const [filterStar, setFilterStar] = useState(0)  // 0 = all

  // Rating breakdown: count per star
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  const sorted = [...reviews]
    .filter((r) => filterStar === 0 || r.rating === filterStar)
    .sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating
      if (sort === 'lowest')  return a.rating - b.rating
      return b.review_id - a.review_id   // most recent
    })

  return (
    <section className="pdp-reviews" ref={sectionRef} aria-label="à¦°à¦¿à¦­à¦¿à¦‰">

      {/* â”€â”€ Top: aggregate + breakdown â”€â”€ */}
      <div className="pdp-reviews__summary">
        <div className="pdp-reviews__aggregate">
          <span className="pdp-reviews__big-score">
            {Number(rating_avg || 0).toFixed(1)}
          </span>
          <StarDisplay rating={rating_avg || 0} size={20} />
          <span className="pdp-reviews__total-count">
            {fmtBn(num_reviews)} à¦Ÿà¦¿ à¦°à¦¿à¦­à¦¿à¦‰à§‡à¦° à¦­à¦¿à¦¤à§à¦¤à¦¿à¦¤à§‡
          </span>
          <button
            className="pdp-reviews__write-cta"
            onClick={onOpenModal}
            aria-label="à¦°à¦¿à¦­à¦¿à¦‰ à¦²à¦¿à¦–à§à¦¨"
          >
            <Star size={15} />
            {myReview ? 'à¦°à¦¿à¦­à¦¿à¦‰ à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾ à¦•à¦°à§à¦¨' : 'à¦à¦•à¦Ÿà¦¿ à¦°à¦¿à¦­à¦¿à¦‰ à¦²à¦¿à¦–à§à¦¨'}
          </button>
        </div>

        {/* Bar breakdown */}
        <div className="pdp-reviews__bars">
          {breakdown.map(({ star, count }) => {
            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
            const active = filterStar === star
            return (
              <button
                key={star}
                className={`pdp-reviews__bar-row ${active ? 'pdp-reviews__bar-row--active' : ''}`}
                onClick={() => setFilterStar(active ? 0 : star)}
                aria-label={`${star} à¦¤à¦¾à¦°à¦¾ â€” ${count} à¦Ÿà¦¿ à¦°à¦¿à¦­à¦¿à¦‰`}
                aria-pressed={active}
              >
                <span className="pdp-reviews__bar-label">{star} â˜…</span>
                <div className="pdp-reviews__bar-track">
                  <div
                    className="pdp-reviews__bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="pdp-reviews__bar-count">{fmtBn(count)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* â”€â”€ Sort + filter controls â”€â”€ */}
      <div className="pdp-reviews__controls">
        <h2 className="pdp-reviews__title">
          à¦ªà¦¾à¦ à¦• à¦°à¦¿à¦­à¦¿à¦‰
          {filterStar > 0 && (
            <button
              className="pdp-reviews__filter-clear"
              onClick={() => setFilterStar(0)}
              aria-label="à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦¸à¦°à¦¾à¦¨"
            >
              {filterStar} â˜… <X size={11} />
            </button>
          )}
        </h2>
        <select
          className="pdp-reviews__sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="à¦¬à¦¾à¦›à¦¾à¦‡ à¦•à¦°à§à¦¨"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* â”€â”€ Loading / empty â”€â”€ */}
      {reviewsLoading && <p className="pdp-reviews__loading">à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>}

      {!reviewsLoading && sorted.length === 0 && (
        <div className="pdp-reviews__empty">
          <Star size={40} strokeWidth={1.2} className="pdp-reviews__empty-icon" />
          <p>
            {filterStar > 0
              ? `${filterStar} à¦¤à¦¾à¦°à¦¾à¦° à¦•à§‹à¦¨à§‹ à¦°à¦¿à¦­à¦¿à¦‰ à¦¨à§‡à¦‡à¥¤`
              : 'à¦à¦‡ à¦¬à¦‡à¦¯à¦¼à§‡ à¦à¦–à¦¨à§‹ à¦•à§‹à¦¨à§‹ à¦°à¦¿à¦­à¦¿à¦‰ à¦¨à§‡à¦‡à¥¤ à¦ªà§à¦°à¦¥à¦® à¦°à¦¿à¦­à¦¿à¦‰à¦Ÿà¦¿ à¦†à¦ªà¦¨à¦¿ à¦¦à¦¿à¦¨!'}
          </p>
          {!authUser && (
            <span className="pdp-reviews__empty-sub">à¦°à¦¿à¦­à¦¿à¦‰ à¦¦à¦¿à¦¤à§‡ à¦²à¦—à¦‡à¦¨ à¦•à¦°à§à¦¨à¥¤</span>
          )}
        </div>
      )}

      {/* â”€â”€ Review cards â”€â”€ */}
      <div className="pdp-reviews__list">
        {!reviewsLoading && sorted.map((r) => {
          const isOwn = myReview?.review_id === r.review_id
          return (
            <div
              key={r.review_id}
              className={`pdp-review-card ${isOwn ? 'pdp-review-card--own' : ''}`}
            >
              <div className="pdp-review-card__header">
                <div className="pdp-review-card__avatar">
                  {(r.reviewer_name || 'à¦…')[0].toUpperCase()}
                </div>
                <div className="pdp-review-card__meta">
                  <span className="pdp-review-card__name">
                    {r.reviewer_name || 'à¦…à¦œà§à¦žà¦¾à¦¤ à¦ªà¦¾à¦ à¦•'}
                    {isOwn && <span className="pdp-review-card__you">à¦†à¦ªà¦¨à¦¿</span>}
                  </span>
                  <div className="pdp-review-card__stars-row">
                    <StarDisplay rating={r.rating} size={13} />
                  </div>
                </div>
                {isOwn && (
                  <button
                    className="pdp-review-card__edit-btn"
                    onClick={onOpenModal}
                    aria-label="à¦°à¦¿à¦­à¦¿à¦‰ à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾"
                    title="à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾ à¦•à¦°à§à¦¨"
                  >
                    à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾
                  </button>
                )}
              </div>
              {r.comment && (
                <p className="pdp-review-card__comment">{r.comment}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 8. MAIN PAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function BookDetailPage() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const { addToCart, toggleWish, isWished, isInCart, authUser } = useApp()

  // â”€â”€ Book state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [book,      setBook]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [qty,       setQty]       = useState(1)
  const [added,     setAdded]     = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [cartError, setCartError] = useState('')
  const [copied,    setCopied]    = useState(false)

  // â”€â”€ Reviews state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [reviews,        setReviews]        = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [myReview,       setMyReview]       = useState(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [submitting,     setSubmitting]     = useState(false)
  const [reviewSuccess,  setReviewSuccess]  = useState(false)

  const reviewSectionRef = useRef(null)

  // â”€â”€ Fetch book â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    setLoading(true)
    fetch(`https://putak-porject-2-1.onrender.com/api/books/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setBook(data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false))
  }, [id])

  // â”€â”€ Fetch reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    setReviewsLoading(true)
    const pub  = api.get(`/reviews/book/${id}`).then((d) => setReviews(d?.data || [])).catch(() => {})
    const mine = authUser
      ? api.get(`/reviews/book/${id}/mine`).then((d) => {
          if (d?.data) { setMyReview(d.data) }
        }).catch(() => {})
      : Promise.resolve()
    Promise.all([pub, mine]).finally(() => setReviewsLoading(false))
  }, [id, authUser])

  // â”€â”€ Auto-scroll on ?review=1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (searchParams.get('review') === '1' && !loading) {
      const t = setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setModalOpen(!!authUser)
      }, 350)
      return () => clearTimeout(t)
    }
  }, [searchParams, loading, authUser])

  // â”€â”€ Review submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleReviewSubmit = useCallback(async (rating, comment) => {
    if (!authUser) { navigate('/login'); return }
    setSubmitting(true)
    try {
      const res = await api.post('/reviews', { bookId: Number(id), rating, comment })
      setMyReview(res.data.review)
      setBook((current) => current && ({
        ...current,
        rating: res.data.average_rating,
        num_reviews: res.data.review_count,
      }))
      setModalOpen(false)
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 3500)
      const updated = await api.get(`/reviews/book/${id}`)
      setReviews(updated?.data || [])
    } catch (err) {
      alert(err.message || 'à¦°à¦¿à¦­à¦¿à¦‰ à¦œà¦®à¦¾ à¦¦à§‡à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤')
    } finally {
      setSubmitting(false)
    }
  }, [authUser, id, navigate])

  // â”€â”€ Review delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDeleteReview = useCallback(async () => {
    if (!myReview || !window.confirm('à¦°à¦¿à¦­à¦¿à¦‰à¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦¦à¦¿à¦¤à§‡ à¦šà¦¾à¦¨?')) return
    try {
      const result = await api.del(`/reviews/${myReview.review_id}`)
      setMyReview(null)
      setBook((current) => current && ({
        ...current,
        rating: result.average_rating,
        num_reviews: result.review_count,
      }))
      setModalOpen(false)
      const updated = await api.get(`/reviews/book/${id}`)
      setReviews(updated?.data || [])
    } catch (err) {
      alert(err.message || 'à¦°à¦¿à¦­à¦¿à¦‰ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿')
    }
  }, [myReview, id])

  // â”€â”€ Cart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCart = async () => {
    if (!authUser) { navigate('/login'); return }
    setCartError('')
    try {
      setAdding(true)
      await addToCart({ ...book, qty, title: book.book_name, cover: book.cover_image_url, price: currentPrice })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      setCartError(err.message || 'à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦¯à§‹à¦— à¦•à¦°à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿')
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = () => {
    if (!authUser) { navigate('/login'); return }
    navigate('/checkout', {
      state: {
        buyNow: {
          book_id:         book.id,
          book_name:       book.book_name,
          cover_image_url: book.cover_image_url,
          price_sold:      currentPrice,
          quantity:        qty,
        }
      }
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // â”€â”€ Loading / not found â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) return (
    <div className="pdp-notfound">
      <div className="pdp-skeleton">
        <div className="pdp-skeleton__cover" />
        <div className="pdp-skeleton__lines">
          <div className="pdp-skeleton__line pdp-skeleton__line--title" />
          <div className="pdp-skeleton__line pdp-skeleton__line--sub" />
          <div className="pdp-skeleton__line pdp-skeleton__line--sub" />
        </div>
      </div>
    </div>
  )

  if (!book) return (
    <div className="pdp-notfound">
      <h2>à¦¬à¦‡à¦Ÿà¦¿ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿</h2>
      <button onClick={() => navigate('/')}>à¦¹à§‹à¦®à§‡ à¦«à¦¿à¦°à§à¦¨</button>
    </div>
  )

  // â”€â”€ Derived values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const category      = book.category_name || book.raw_category || 'à¦¸à¦¾à¦§à¦¾à¦°à¦£'
  const publicationId = book.publications?.[0]?.publication_id || null
  const publisher     = book.publications?.[0]?.title || book.publisher || 'à¦…à¦œà§à¦žà¦¾à¦¤ à¦ªà§à¦°à¦•à¦¾à¦¶à¦•'
  const rating_avg    = book.rating     ? Number(book.rating) : 0
  const num_reviews   = book.num_reviews || 0
  const inStock       = book.availability !== 'Out of stock' && book.availability !== 'Unavailable'
  const currentPrice  = book.discount_price && Number(book.discount_price) < Number(book.price)
    ? book.discount_price : book.price
  const originalPrice = book.discount_price && Number(book.discount_price) < Number(book.price)
    ? book.price : null
  const discountPct   = book.discount_percentage ? `${book.discount_percentage}%` : null
  const wished        = isWished(book.id)
  const inCart        = isInCart(book.id)

  return (
    <>
      <div className="pdp">
        <div className="pdp__container">

          {/* Back button (mobile only) */}
          <button className="pdp__back" onClick={() => navigate(-1)} aria-label="à¦ªà¦¿à¦›à¦¨à§‡ à¦¯à¦¾à¦¨">
            <ArrowLeft size={16} /> à¦ªà¦¿à¦›à¦¨à§‡ à¦¯à¦¾à¦¨
          </button>

          {/* â”€â”€ 3-column grid â”€â”€ */}
          <div className="pdp__grid">

            {/* LEFT â€” media + trust */}
            <ProductMedia
              book={book}
              wished={wished}
              onWish={() => toggleWish({ ...book, title: book.book_name, cover: book.cover_image_url, price: currentPrice })}
              onShare={handleShare}
              copied={copied}
              discountPct={discountPct}
            />

            {/* CENTER â€” info + purchase */}
            <ProductInfo
              book={book}
              category={category}
              publisher={publisher}
              publicationId={publicationId}
              rating_avg={rating_avg}
              num_reviews={num_reviews}
              reviewSectionRef={reviewSectionRef}
              currentPrice={currentPrice}
              originalPrice={originalPrice}
              discountPct={discountPct}
              inStock={inStock}
              qty={qty}
              onQtyChange={setQty}
              inCart={inCart}
              added={added}
              adding={adding}
              onCart={handleCart}
              onBuyNow={handleBuyNow}
              cartError={cartError}
            />
          </div>

          {/* â”€â”€ Reviews (full width below grid) â”€â”€ */}
          {reviewSuccess && (
            <div className="pdp-review-success" role="status">
              <Check size={15} /> à¦°à¦¿à¦­à¦¿à¦‰ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦œà¦®à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!
            </div>
          )}

          <ReviewSection
            reviews={reviews}
            reviewsLoading={reviewsLoading}
            myReview={myReview}
            rating_avg={rating_avg}
            num_reviews={num_reviews}
            authUser={authUser}
            onOpenModal={() => {
              if (!authUser) { navigate('/login'); return }
              setModalOpen(true)
            }}
            sectionRef={reviewSectionRef}
          />
        </div>
      </div>

      {/* â”€â”€ Sticky mobile CTA â”€â”€ */}
      {inStock && (
        <div className="pdp-sticky-cta" aria-label="à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦•à§à¦°à¦¯à¦¼ à¦¬à¦¾à¦°">
          <div className="pdp-sticky-cta__price">
            <strong>à§³{currentPrice}</strong>
            {originalPrice && <s>à§³{originalPrice}</s>}
          </div>
          <button
            className="pdp-sticky-cta__cart"
            onClick={handleCart}
            disabled={adding}
          >
            <ShoppingBag size={16} />
            {added ? 'à¦¯à§‹à¦— à¦¹à¦¯à¦¼à§‡à¦›à§‡' : 'à¦•à¦¾à¦°à§à¦Ÿà§‡ à¦¯à§‹à¦— à¦•à¦°à§à¦¨'}
          </button>
          <button
            className="pdp-sticky-cta__buy"
            onClick={handleBuyNow}
          >
            à¦à¦–à¦¨à¦‡ à¦•à¦¿à¦¨à§à¦¨
          </button>
        </div>
      )}

      {/* â”€â”€ Review modal â”€â”€ */}
      {modalOpen && (
        <ReviewModal
          myReview={myReview}
          onClose={() => setModalOpen(false)}
          onSubmit={handleReviewSubmit}
          onDelete={handleDeleteReview}
          submitting={submitting}
        />
      )}
    </>
  )
}

