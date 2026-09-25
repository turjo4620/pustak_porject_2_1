import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, X, ArrowRight, BookOpen, TrendingUp,
  ShoppingBag, Package, Heart, Star
} from 'lucide-react'
import BookCard from '../components/BookCard'
import { useApp } from '../context/AppContext'
import './account-dashboard.css'
import './AccountHomePage.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

// â”€â”€ Quick stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ icon: Icon, label, value, to, color }) {
  const navigate = useNavigate()
  return (
    <button
      className="ahp-stat-card"
      style={{ '--stat-color': color }}
      onClick={() => navigate(to)}
      aria-label={label}
    >
      <span className="ahp-stat-icon"><Icon size={20} strokeWidth={1.8} /></span>
      <span className="ahp-stat-value">{value}</span>
      <span className="ahp-stat-label">{label}</span>
    </button>
  )
}

// â”€â”€ Compact horizontal book shelf â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BookShelf({ title, linkText, linkHref, books, loading }) {
  return (
    <div className="ahp-shelf">
      <div className="ahp-shelf__header">
        <h3 className="ahp-shelf__title">{title}</h3>
        <Link to={linkHref} className="ahp-shelf__link">
          {linkText} <ArrowRight size={14} />
        </Link>
      </div>
      {loading ? (
        <div className="ahp-shelf__grid">
          {[...Array(5)].map((_, i) => <div key={i} className="ahp-shelf__skeleton" />)}
        </div>
      ) : books.length === 0 ? null : (
        <div className="ahp-shelf__grid">
          {books.map(book => (
            <div key={book.id} className="ahp-shelf__item">
              <BookCard book={book} size="small" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// â”€â”€ Category chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CategoryChips({ categories }) {
  if (!categories || categories.length === 0) return null
  return (
    <div className="ahp-cats">
      <div className="ahp-shelf__header">
        <h3 className="ahp-shelf__title">à¦¬à¦¿à¦­à¦¾à¦— à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ à¦¬à¦‡</h3>
        <Link to="/categories" className="ahp-shelf__link">
          à¦¸à¦¬ à¦¬à¦¿à¦­à¦¾à¦— <ArrowRight size={14} />
        </Link>
      </div>
      <div className="ahp-cats__grid">
        {categories.slice(0, 12).map(cat => (
          <Link
            key={cat.category_id}
            to={`/category/${cat.category_id}`}
            className="ahp-cat-chip"
          >
            {cat.category_name}
          </Link>
        ))}
      </div>
    </div>
  )
}

// â”€â”€ Author chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AuthorChips({ authors }) {
  if (!authors || authors.length === 0) return null
  return (
    <div className="ahp-cats ahp-cats--authors">
      <div className="ahp-shelf__header">
        <h3 className="ahp-shelf__title">à¦²à§‡à¦–à¦• à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ à¦¬à¦‡</h3>
        <Link to="/authors" className="ahp-shelf__link">
          à¦¸à¦¬ à¦²à§‡à¦–à¦• <ArrowRight size={14} />
        </Link>
      </div>
      <div className="ahp-cats__grid">
        {authors.slice(0, 16).map(a => (
          <Link
            key={a.author_id}
            to={`/author/${a.author_id}`}
            className="ahp-cat-chip ahp-cat-chip--author"
          >
            {a.photo_url && (
              <img
                src={a.photo_url}
                alt=""
                className="ahp-chip-avatar"
                loading="lazy"
              />
            )}
            {!a.photo_url && (
              <span className="ahp-chip-initial">
                {(a.name || '?').charAt(0)}
              </span>
            )}
            {a.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

// â”€â”€ Publisher chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PublisherChips({ publishers }) {
  if (!publishers || publishers.length === 0) return null
  return (
    <div className="ahp-cats ahp-cats--publishers">
      <div className="ahp-shelf__header">
        <h3 className="ahp-shelf__title">à¦ªà§à¦°à¦•à¦¾à¦¶à¦• à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ à¦¬à¦‡</h3>
        <Link to="/publishers" className="ahp-shelf__link">
          à¦¸à¦¬ à¦ªà§à¦°à¦•à¦¾à¦¶à¦• <ArrowRight size={14} />
        </Link>
      </div>
      <div className="ahp-cats__grid">
        {publishers.slice(0, 16).map(p => (
          <Link
            key={p.publication_id}
            to={`/publisher/${p.publication_id}`}
            className="ahp-cat-chip ahp-cat-chip--publisher"
          >
            {p.cover_image_url && (
              <img
                src={p.cover_image_url}
                alt=""
                className="ahp-chip-avatar ahp-chip-avatar--square"
                loading="lazy"
              />
            )}
            {!p.cover_image_url && (
              <span className="ahp-chip-initial ahp-chip-initial--square">
                {(p.title || 'à¦ªà§à¦°').slice(0, 2)}
              </span>
            )}
            {p.title}
          </Link>
        ))}
      </div>
    </div>
  )
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AccountHomePage() {
  const navigate = useNavigate()
  const { authUser, cartItems, wishItems } = useApp()

  // Search
  const [q, setQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const debounceRef = useRef(null)
  const seqRef = useRef(0)
  const inputRef = useRef(null)

  // Book sections
  const [newArrivals, setNewArrivals] = useState([])
  const [newLoading, setNewLoading] = useState(true)
  const [bestsellers, setBestsellers] = useState([])
  const [bestLoading, setBestLoading] = useState(true)
  const [recommended, setRecommended] = useState([])
  const [recoLoading, setRecoLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])
  const [publishers, setPublishers] = useState([])

  const name = authUser?.name || authUser?.full_name || 'à¦¬à¦¨à§à¦§à§'
  const firstName = name.trim().split(/\s+/)[0]

  // â”€â”€ Fetch book sections on mount â”€â”€
  useEffect(() => {
    fetch(`${BASE}/books/new-arrivals?limit=10`)
      .then(r => r.json())
      .then(j => setNewArrivals(j.data || []))
      .catch(() => {})
      .finally(() => setNewLoading(false))

    fetch(`${BASE}/books/bestsellers?limit=10`)
      .then(r => r.json())
      .then(j => setBestsellers(j.data || []))
      .catch(() => {})
      .finally(() => setBestLoading(false))

    fetch(`${BASE}/books/bestsellers?limit=10&offset=10`)
      .then(r => r.json())
      .then(j => setRecommended(j.data || []))
      .catch(() => {})
      .finally(() => setRecoLoading(false))

    fetch(`${BASE}/categories`)
      .then(r => r.json())
      .then(j => setCategories(j.data || []))
      .catch(() => {})

    fetch(`${BASE}/authors`)
      .then(r => r.json())
      .then(j => setAuthors(j.data || []))
      .catch(() => {})

    fetch(`${BASE}/publications`)
      .then(r => r.json())
      .then(j => setPublishers(j.data || []))
      .catch(() => {})
  }, [])

  // â”€â”€ Debounced live search â”€â”€
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const term = q.trim()
    if (term.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    const seq = ++seqRef.current
    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/books/search?q=${encodeURIComponent(term)}&limit=6`)
        const json = await res.json()
        if (seq === seqRef.current) setSearchResults(json.data || [])
      } catch {
        if (seq === seqRef.current) setSearchResults([])
      } finally {
        if (seq === seqRef.current) setSearchLoading(false)
      }
    }, 280)
    return () => clearTimeout(debounceRef.current)
  }, [q])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    setSearchFocused(false)
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const showDropdown = searchFocused && q.trim().length >= 2

  // Quick stats
  const orderCount = cartItems?.length ?? 0
  const wishCount  = wishItems?.length ?? 0

  // Greeting by time of day
  const hour = new Date().getHours()
  const greeting =
    hour < 5  ? 'à¦¶à§à¦­ à¦°à¦¾à¦¤' :
    hour < 12 ? 'à¦¶à§à¦­ à¦¸à¦•à¦¾à¦²' :
    hour < 17 ? 'à¦¶à§à¦­ à¦…à¦ªà¦°à¦¾à¦¹à§à¦¨' :
    hour < 21 ? 'à¦¶à§à¦­ à¦¸à¦¨à§à¦§à§à¦¯à¦¾' : 'à¦¶à§à¦­ à¦°à¦¾à¦¤'

  return (
    <div className="ahp-root">

      {/* â”€â”€ Welcome banner â”€â”€ */}
      <div className="ahp-welcome">
        <div className="ahp-welcome__text">
          <p className="ahp-welcome__greeting">{greeting}, {firstName} ðŸ‘‹</p>
          <h2 className="ahp-welcome__headline">à¦†à¦œ à¦•à§‹à¦¨ à¦¬à¦‡à¦Ÿà¦¿ à¦ªà¦¡à¦¼à¦¬à§‡à¦¨?</h2>
          <p className="ahp-welcome__sub">
            à¦¨à¦¤à§à¦¨ à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨, à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¨, à¦…à¦¥à¦¬à¦¾ à¦†à¦ªà¦¨à¦¾à¦° à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦¦à§‡à¦–à§à¦¨à¥¤
          </p>
        </div>
        <div className="ahp-welcome__deco" aria-hidden="true">
          <BookOpen size={64} strokeWidth={1} />
        </div>
      </div>

      {/* â”€â”€ Quick stats â”€â”€ */}
      <div className="ahp-stats-row">
        <StatCard
          icon={ShoppingBag}
          label="à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¨"
          value="à¦¬à¦‡ à¦•à¦¿à¦¨à§à¦¨"
          to="/account/order"
          color="#0f766e"
        />
        <StatCard
          icon={Package}
          label="à¦…à¦°à§à¦¡à¦¾à¦° à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚"
          value="à¦Ÿà§à¦°à§à¦¯à¦¾à¦• à¦•à¦°à§à¦¨"
          to="/account/orders"
          color="#0369a1"
        />
        <StatCard
          icon={Heart}
          label="à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾"
          value={wishCount > 0 ? `${wishCount}à¦Ÿà¦¿ à¦¬à¦‡` : 'à¦–à¦¾à¦²à¦¿'}
          to="/account/wishlist"
          color="#be185d"
        />
        <StatCard
          icon={Star}
          label="à¦°à¦¿à¦­à¦¿à¦‰ à¦“ à¦°à§‡à¦Ÿà¦¿à¦‚"
          value="à¦†à¦®à¦¾à¦° à¦°à¦¿à¦­à¦¿à¦‰"
          to="/account/reviews"
          color="#b45309"
        />
      </div>

      {/* â”€â”€ Search bar â”€â”€ */}
      <div className="ahp-search-card">
        <form
          className={`ahp-search-form ${searchFocused ? 'ahp-search-form--focused' : ''}`}
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <Search size={18} className="ahp-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="ahp-search-input"
            placeholder="à¦¬à¦‡, à¦²à§‡à¦–à¦• à¦¬à¦¾ à¦¬à¦¿à¦­à¦¾à¦— à¦²à¦¿à¦–à§à¦¨..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            autoComplete="off"
            aria-label="à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨"
          />
          {q && (
            <button
              type="button"
              className="ahp-search-clear"
              onClick={() => { setQ(''); setSearchResults([]); inputRef.current?.focus() }}
              aria-label="à¦®à§à¦›à§à¦¨"
            >
              <X size={15} />
            </button>
          )}
          <button type="submit" className="ahp-search-btn">à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨</button>

          {/* Live dropdown */}
          {showDropdown && (
            <div className="ahp-search-dropdown" role="listbox">
              {searchLoading && (
                <p className="ahp-search-status">à¦–à§à¦à¦œà¦›à¦¿...</p>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <p className="ahp-search-status">à¦•à§‹à¦¨à§‹ à¦«à¦²à¦¾à¦«à¦² à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤</p>
              )}
              {!searchLoading && searchResults.map(book => (
                <div
                  key={book.id}
                  className="ahp-search-result"
                  role="option"
                  tabIndex={0}
                  onClick={() => { setSearchFocused(false); navigate(`/book/${book.id}`) }}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/book/${book.id}`)}
                >
                  {book.cover_image_url
                    ? <img src={book.cover_image_url} alt="" className="ahp-search-result__cover" />
                    : <div className="ahp-search-result__cover ahp-search-result__cover--fallback"><BookOpen size={16} /></div>
                  }
                  <div className="ahp-search-result__info">
                    <strong className="ahp-search-result__title">{book.book_name}</strong>
                    <span className="ahp-search-result__author">{book.author || ''}</span>
                  </div>
                </div>
              ))}
              {!searchLoading && searchResults.length > 0 && (
                <button type="submit" className="ahp-search-all">
                  "{q}" â€” à¦¸à¦¬ à¦«à¦²à¦¾à¦«à¦² à¦¦à§‡à¦–à§à¦¨ â†’
                </button>
              )}
            </div>
          )}
        </form>

        {/* Trending chips */}
        <div className="ahp-trending">
          <TrendingUp size={13} className="ahp-trending__icon" />
          <span className="ahp-trending__label">à¦Ÿà§à¦°à§‡à¦¨à§à¦¡à¦¿à¦‚:</span>
          {['à¦¹à¦¿à¦®à§', 'à¦¹à§à¦®à¦¾à¦¯à¦¼à§‚à¦¨ à¦†à¦¹à¦®à§‡à¦¦', 'à¦°à¦¬à§€à¦¨à§à¦¦à§à¦°à¦¨à¦¾à¦¥', 'à¦®à§à¦•à§à¦¤à¦¿à¦¯à§à¦¦à§à¦§', 'à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨'].map(t => (
            <button
              key={t}
              type="button"
              className="ahp-trending__chip"
              onClick={() => navigate(`/search?q=${encodeURIComponent(t)}`)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Category / Author / Publisher chips â”€â”€ */}
      <div className="ahp-card">
        <CategoryChips categories={categories} />
        <AuthorChips authors={authors} />
        <PublisherChips publishers={publishers} />
      </div>

      {/* â”€â”€ Recommended / Bestsellers â”€â”€ */}
      <div className="ahp-card">
        <BookShelf
          title="à¦œà¦¨à¦ªà§à¦°à¦¿à¦¯à¦¼ à¦¬à¦‡"
          linkText="à¦¸à¦¬ à¦¬à§‡à¦¸à§à¦Ÿà¦¸à§‡à¦²à¦¾à¦°"
          linkHref="/bestsellers"
          books={bestsellers}
          loading={bestLoading}
        />
      </div>

      {/* â”€â”€ New arrivals â”€â”€ */}
      <div className="ahp-card">
        <BookShelf
          title="à¦¨à¦¤à§à¦¨ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¿à¦¤"
          linkText="à¦¸à¦¬ à¦¨à¦¤à§à¦¨ à¦¬à¦‡"
          linkHref="/new-arrivals"
          books={newArrivals}
          loading={newLoading}
        />
      </div>

      {/* â”€â”€ Recommended â”€â”€ */}
      <div className="ahp-card">
        <BookShelf
          title="à¦†à¦ªà¦¨à¦¾à¦° à¦œà¦¨à§à¦¯ à¦¬à¦¾à¦›à¦¾à¦‡"
          linkText="à¦¸à¦¬ à¦¬à¦‡ à¦¦à§‡à¦–à§à¦¨"
          linkHref="/bestsellers"
          books={recommended}
          loading={recoLoading}
        />
      </div>

    </div>
  )
}

