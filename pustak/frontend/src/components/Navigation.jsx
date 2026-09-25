import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, NavLink } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Menu, X, Sun, Moon, Trash2, ArrowRight,
         Package, Star, LogOut, RotateCcw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './Navigation.css'

const navLinks = [
  { label: 'বিভাগ', to: '/categories' },
  { label: 'আজকের অফার', to: '/offers' },
  { label: 'নতুন বই',    to: '/new-arrivals' },
  { label: 'বেস্টসেলার', to: '/bestsellers' },
  { label: 'লেখক',       to: '/authors' },
  { label: 'প্রকাশক',    to: '/publishers' },
]

const trendingSearches = ['হিমু', 'হুমায়ূন আহমেদ', 'রবীন্দ্রনাথ', 'মুক্তিযুদ্ধ', 'বিজ্ঞান']
const BASE = 'http://localhost:5000/api'

export default function Navigation({ isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate()
  const { cartItems, wishItems, removeFromCart, totalCartPrice,
          cartOpen, setCartOpen, wishOpen, setWishOpen, authUser, signOut } = useApp()

  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userOpen, setUserOpen]   = useState(false)
  const [query, setQuery]         = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)
  const searchDebounce = useRef(null)
  const searchRequestSeq = useRef(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    clearTimeout(searchDebounce.current)
    const term = query.trim()
    if (term.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    const seq = ++searchRequestSeq.current
    setSearchLoading(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const response = await fetch(`${BASE}/books/search?q=${encodeURIComponent(term)}&limit=6`)
        const json = await response.json()
        if (seq === searchRequestSeq.current) setSearchResults(json.data || [])
      } catch {
        if (seq === searchRequestSeq.current) setSearchResults([])
      } finally {
        if (seq === searchRequestSeq.current) setSearchLoading(false)
      }
    }, 280)

    return () => clearTimeout(searchDebounce.current)
  }, [query])

  
  // Close drawers on route change
  useEffect(() => {
    setMobileOpen(false)
    setCartOpen(false)
    setWishOpen(false)
    setUserOpen(false)
  }, [navigate])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
      setSuggestions([])
    }
  }

  const handleSearchChip = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`)
    setSearchOpen(false)
    setQuery('')
  }

  const handleSearchResult = (bookId) => {
    navigate(`/book/${bookId}`)
    setSearchOpen(false)
    setQuery('')
  }

  const anyDrawerOpen = cartOpen || wishOpen || userOpen || mobileOpen

  return (
    <>
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`} role="navigation" aria-label="প্রধান নেভিগেশন">
        <div className="nav__inner container">

          {/* Logo */}
          <Link to="/" className="nav__logo" aria-label="পুস্তক হোম">
            <PustakLogo />
          </Link>

          {/* Desktop Links */}
          <ul className="nav__links" role="list">
            {navLinks.map((link) => (
              <li key={link.label} className="nav__item">
                  <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          `nav__link${isActive ? ' nav__link--active' : ''}`
                        }
                      >
                        {link.label}
                      </NavLink>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="nav__actions">
            <button
              className="nav__icon-btn"
              aria-label="অনুসন্ধান"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} />
            </button>

            <button
              className={`nav__icon-btn nav__icon-btn--badge ${wishOpen ? 'nav__icon-btn--open' : ''}`}
              aria-label={`উইশলিস্ট (${wishItems.length} টি বই)`}
              aria-expanded={wishOpen}
              data-count={wishItems.length || ''}
              onClick={() => { setWishOpen(!wishOpen); setCartOpen(false); setUserOpen(false) }}
            >
              <Heart size={20} />
            </button>

            <button
              className={`nav__icon-btn nav__icon-btn--badge ${cartOpen ? 'nav__icon-btn--open' : ''}`}
              aria-label={`কার্ট (${cartItems.length} টি বই)`}
              aria-expanded={cartOpen}
              data-count={cartItems.length || ''}
              onClick={() => { setCartOpen(!cartOpen); setWishOpen(false); setUserOpen(false) }}
            >
              <ShoppingBag size={20} />
            </button>

            <button
              className={`nav__theme-toggle ${isDarkMode ? 'nav__theme-toggle--dark' : ''}`}
              aria-label={isDarkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              <span className="nav__theme-toggle__track">
                <span className="nav__theme-toggle__thumb">
                  <Sun  size={11} className="nav__theme-toggle__sun"  aria-hidden="true" />
                  <Moon size={11} className="nav__theme-toggle__moon" aria-hidden="true" />
                </span>
              </span>
            </button>

            {authUser ? (
              <button
                className={`nav__icon-btn nav__icon-btn--user ${userOpen ? 'nav__icon-btn--open' : ''}`}
                aria-label="আমার অ্যাকাউন্ট"
                aria-expanded={userOpen}
                onClick={() => {
                  if (userOpen) navigate('/account')
                  else setUserOpen(true)
                  setCartOpen(false)
                  setWishOpen(false)
                }}
              >
                <User size={20} />
              </button>
            ) : (
              <button
                className="nav__signin-btn"
                onClick={() => navigate('/login')}
                aria-label="লগইন করুন"
              >
                লগইন
              </button>
            )}

            <button
              className="nav__hamburger"
              aria-label="মেনু"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

      </nav>

      {/* ── Cart Drawer ── */}
      <Drawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`কার্ট (${cartItems.length})`}
        side="right"
      >
        {cartItems.length === 0 ? (
          <div className="drawer__empty">
            <ShoppingBag size={48} opacity={0.25} />
            <p>কার্ট খালি আছে</p>
            <button
              className="drawer__cta"
              onClick={() => { setCartOpen(false); navigate('/') }}
            >
              বই কিনুন
            </button>
          </div>
        ) : (
          <>
            <ul className="drawer__list">
              {cartItems.map((b) => (
                <li key={b.cart_item_id} className="drawer__item">
                  <img
                    src={b.cover_image_url}
                    alt={b.book_name}
                    className="drawer__item-cover"
                    onClick={() => { setCartOpen(false); navigate(`/book/${b.book_id}`) }}
                  />
                  <div className="drawer__item-info">
                    <strong
                      className="drawer__item-title"
                      onClick={() => { setCartOpen(false); navigate(`/book/${b.book_id}`) }}
                    >
                      {b.book_name}
                    </strong>
                    <span className="drawer__item-author">{b.authors}</span>
                    <span className="drawer__item-price">৳{b.locked_price}</span>
                  </div>
                  <button
                    className="drawer__item-remove"
                    onClick={() => removeFromCart(b.cart_item_id)}
                    aria-label={`${b.book_name} সরান`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="drawer__footer">
              <div className="drawer__total">
                <span>মোট</span>
                <strong>৳{totalCartPrice}</strong>
              </div>
              <button
                className="drawer__checkout"
                onClick={() => { setCartOpen(false); navigate('/checkout') }}
              >
                চেকআউট করুন
              </button>
            </div>
          </>
        )}
      </Drawer>

      {/* ── Wishlist Drawer ── */}
      <Drawer
        open={wishOpen}
        onClose={() => setWishOpen(false)}
        title={`উইশলিস্ট (${wishItems.length})`}
        side="right"
      >
        {wishItems.length === 0 ? (
          <div className="drawer__empty">
            <Heart size={48} opacity={0.25} />
            <p>উইশলিস্ট খালি আছে</p>
            <button
              className="drawer__cta"
              onClick={() => { setWishOpen(false); navigate('/') }}
            >
              বই ব্রাউজ করুন
            </button>
          </div>
        ) : (
          <ul className="drawer__list">
            {wishItems.map((b) => (
              <li key={b.wishlist_item_id} className="drawer__item">
                <img
                  src={b.cover_image_url}
                  alt={b.book_name}
                  className="drawer__item-cover"
                  onClick={() => { setWishOpen(false); navigate(`/book/${b.book_id}`) }}
                />
                <div className="drawer__item-info">
                  <strong
                    className="drawer__item-title"
                    onClick={() => { setWishOpen(false); navigate(`/book/${b.book_id}`) }}
                  >
                    {b.book_name}
                  </strong>
                  <span className="drawer__item-author">{b.authors}</span>
                  <span className="drawer__item-price">
                    ৳{b.discount_price ?? b.price}
                  </span>
                </div>
                <button
                  className="drawer__item-remove"
                  onClick={() => toggleWish(b)}
                  aria-label={`${b.book_name} সরান`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      {/* ── User Drawer ── */}
      <Drawer
        open={userOpen}
        onClose={() => setUserOpen(false)}
        title="আমার অ্যাকাউন্ট"
        side="right"
      >
        <div className="user-drawer">
          {authUser ? (
            <>
              {/* ── Profile header ── */}
              <div className="user-drawer__profile">
                <div className="user-drawer__avatar">
                  {(authUser.name || authUser.email || 'U').slice(0,1).toUpperCase()}
                </div>
                <div className="user-drawer__profile-info">
                  <p className="user-drawer__name">
                    {authUser.name || authUser.email}
                  </p>
                  {(authUser.email || authUser.phone) && (
                    <p className="user-drawer__contact">
                      {authUser.email || authUser.phone}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="user-drawer__account-btn"
                  aria-label="অ্যাকাউন্টে যান"
                  title="অ্যাকাউন্টে যান"
                  onClick={() => { setUserOpen(false); navigate('/account') }}
                >
                  <User size={18} />
                </button>
              </div>

              {/* ── Nav links ── */}
              <div className="user-drawer__links">
                {[
                  { label: 'আমার তথ্য',          to: '/account/profile', icon: User      },
                  { label: 'অর্ডার দিন',         to: '/account/order',   icon: ShoppingBag },
                  { label: 'অর্ডার ট্র্যাকিং',    to: '/account/orders',  icon: Package   },
                  { label: 'পছন্দের তালিকা',     to: '/account/wishlist', icon: Heart     },
                  { label: 'রিটার্ন ও রিফান্ড',   to: '/account/returns', icon: RotateCcw },
                  { label: 'রিভিউ ও রেটিং',       to: '/account/reviews', icon: Star      },
                ].map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="user-drawer__link"
                    onClick={() => setUserOpen(false)}
                  >
                    <span className="user-drawer__link-inner">
                      <Icon size={16} className="user-drawer__link-icon" strokeWidth={1.8} />
                      {label}
                    </span>
                    <ArrowRight size={14} className="user-drawer__link-arrow" />
                  </Link>
                ))}

                {/* Divider before logout */}
                <div className="user-drawer__divider" />

                <button
                  className="user-drawer__link user-drawer__link--signout"
                  onClick={() => { signOut(); setUserOpen(false); navigate('/') }}
                >
                  <span className="user-drawer__link-inner">
                    <LogOut size={16} className="user-drawer__link-icon" strokeWidth={1.8} />
                    লগআউট
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="user-drawer__avatar">পা</div>
              <p className="user-drawer__name">অতিথি পাঠক</p>
              <div className="user-drawer__links">
                {[
                  { label: 'লগইন করুন',    to: '/login' },
                  { label: 'নিবন্ধন করুন', to: '/register' },
                ].map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="user-drawer__link"
                    onClick={() => setUserOpen(false)}
                  >
                    <span className="user-drawer__link-inner">{l.label}</span>
                    <ArrowRight size={14} className="user-drawer__link-arrow" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </Drawer>

      {/* ── Mobile Drawer ── */}
      <div className={`nav__drawer ${mobileOpen ? 'nav__drawer--open' : ''}`} role="dialog" aria-modal="true">
        <div className="nav__drawer-inner">
          <div className="nav__drawer-header">
            <Link to="/" onClick={() => setMobileOpen(false)}><PustakLogo /></Link>
            <button onClick={() => setMobileOpen(false)} aria-label="বন্ধ করুন">
              <X size={22} />
            </button>
          </div>
          
          {/* User section */}
          {authUser ? (
            <div className="nav__drawer-user">
              <div className="nav__drawer-user-avatar">{(authUser.name || authUser.email || 'U').slice(0,1).toUpperCase()}</div>
              <div className="nav__drawer-user-info">
                <p className="nav__drawer-user-name">{authUser.name || authUser.email}</p>
                <Link to="/account/profile" className="nav__drawer-user-link" onClick={() => setMobileOpen(false)}>
                  প্রোফাইল দেখুন
                </Link>
              </div>
            </div>
          ) : (
            <div className="nav__drawer-signin">
              <button
                className="nav__drawer-signin-btn"
                onClick={() => { setMobileOpen(false); navigate('/login') }}
              >
                লগইন করুন
              </button>
              <p className="nav__drawer-signin-text">
                নতুন ব্যবহারকারী? <Link to="/register" onClick={() => setMobileOpen(false)}>নিবন্ধন করুন</Link>
              </p>
            </div>
          )}

          <nav className="nav__drawer-links">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="nav__drawer-link"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {authUser && (
            <div className="nav__drawer-account-links">
              <Link to="/account/profile" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                আমার তথ্য
              </Link>
              <Link to="/account/order" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                অর্ডার দিন
              </Link>
              <Link to="/account/orders" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                অর্ডার ট্র্যাকিং
              </Link>
              <Link to="/account/wishlist" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                পছন্দের তালিকা
              </Link>
              <Link to="/account/returns" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                রিটার্ন ও রিফান্ড
              </Link>
              <Link to="/account/reviews" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                রিভিউ ও রেটিং
              </Link>
            </div>
          )}
          
          <div className="nav__drawer-footer">
            <button className="nav__drawer-dark-btn" onClick={toggleDarkMode}>
              {isDarkMode ? <><Sun size={16}/> লাইট মোড</> : <><Moon size={16}/> ডার্ক মোড</>}
            </button>
            {authUser && (
              <button 
                className="nav__drawer-signout-btn"
                onClick={() => { signOut(); setMobileOpen(false); navigate('/') }}
              >
                লগআউট
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for all drawers/mobile */}
      {anyDrawerOpen && (
        <div
          className="nav__overlay"
          onClick={() => {
            setMobileOpen(false)
            setCartOpen(false)
            setWishOpen(false)
            setUserOpen(false)
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Search Modal ── */}
      {searchOpen && (
        <div className="search-modal" role="dialog" aria-modal="true" aria-label="বই খুঁজুন">
          <div className="search-modal__backdrop" onClick={() => setSearchOpen(false)} />
          <div className="search-modal__box">
            <form className="search-modal__input-wrap" onSubmit={handleSearch}>
              <Search size={22} className="search-modal__icon" />
              <input
                ref={searchRef}
                type="search"
                className="search-modal__input"
                placeholder="বই, লেখক বা বিভাগ খুঁজুন..."
                aria-label="বই খুঁজুন"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="search-modal__submit" aria-label="অনুসন্ধান করুন">
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="search-modal__close"
                onClick={() => setSearchOpen(false)}
                aria-label="বন্ধ করুন"
              >
                <X size={20} />
              </button>
            </form>
            {query.trim().length >= 2 ? (
              <div className="search-modal__results" role="listbox" aria-label="অনুসন্ধান ফলাফল">
                {searchLoading && <p className="search-modal__status">খুঁজছি...</p>}
                {!searchLoading && searchResults.length === 0 && (
                  <p className="search-modal__status">কোনো ফলাফল পাওয়া যায়নি।</p>
                )}
                {!searchLoading && searchResults.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="search-modal__result"
                    role="option"
                    onClick={() => handleSearchResult(book.id)}
                  >
                    {book.cover_image_url
                      ? <img src={book.cover_image_url} alt="" className="search-modal__result-cover" />
                      : <span className="search-modal__result-cover search-modal__result-cover--fallback">বই</span>
                    }
                    <span className="search-modal__result-info">
                      <strong>{book.book_name}</strong>
                      <span>{book.author || book.authors?.[0]?.name || ''}</span>
                    </span>
                    <span className="search-modal__result-type">বই</span>
                  </button>
                ))}
                {!searchLoading && searchResults.length > 0 && (
                  <button type="submit" className="search-modal__all">
                    "{query.trim()}" — সব ফলাফল দেখুন →
                  </button>
                )}
              </div>
            ) : (
              <div className="search-modal__trending">
                <p className="search-modal__label">ট্রেন্ডিং অনুসন্ধান</p>
                <div className="search-modal__chips">
                  {trendingSearches.map((t) => (
                    <button
                      key={t}
                      className="search-modal__chip"
                      onClick={() => handleSearchChip(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ── Reusable Drawer ── */
function Drawer({ open, onClose, title, children, side = 'right' }) {
  return (
    <div
      className={`side-drawer side-drawer--${side} ${open ? 'side-drawer--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="side-drawer__header">
        <h2 className="side-drawer__title">{title}</h2>
        <button className="side-drawer__close" onClick={onClose} aria-label="বন্ধ করুন">
          <X size={20} />
        </button>
      </div>
      <div className="side-drawer__body">{children}</div>
    </div>
  )
}

/* ── Logo ── */
function PustakLogo() {
  return (
    <div className="pustak-logo" aria-label="পুস্তক">
      <svg width="110" height="44" viewBox="0 0 110 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 36 Q30 40 55 38 Q80 36 102 39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
        <path d="M46 4 Q55 1 64 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
        <text x="55" y="30" textAnchor="middle" fontFamily="'Noto Serif Bengali', 'Tiro Bangla', serif" fontWeight="700" fontSize="26" fill="currentColor" letterSpacing="1">পুস্তক</text>
        <circle cx="55" cy="6" r="1.5" fill="currentColor" opacity="0.6"/>
      </svg>
    </div>
  )
}
