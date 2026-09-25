import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, NavLink } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Menu, X, Sun, Moon, Trash2, ArrowRight,
         Package, Star, LogOut, RotateCcw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './Navigation.css'

const navLinks = [
  { label: 'à¦¬à¦¿à¦­à¦¾à¦—', to: '/categories' },
  { label: 'à¦†à¦œà¦•à§‡à¦° à¦…à¦«à¦¾à¦°', to: '/offers' },
  { label: 'à¦¨à¦¤à§à¦¨ à¦¬à¦‡',    to: '/new-arrivals' },
  { label: 'à¦¬à§‡à¦¸à§à¦Ÿà¦¸à§‡à¦²à¦¾à¦°', to: '/bestsellers' },
  { label: 'à¦²à§‡à¦–à¦•',       to: '/authors' },
  { label: 'à¦ªà§à¦°à¦•à¦¾à¦¶à¦•',    to: '/publishers' },
]

const trendingSearches = ['à¦¹à¦¿à¦®à§', 'à¦¹à§à¦®à¦¾à¦¯à¦¼à§‚à¦¨ à¦†à¦¹à¦®à§‡à¦¦', 'à¦°à¦¬à§€à¦¨à§à¦¦à§à¦°à¦¨à¦¾à¦¥', 'à¦®à§à¦•à§à¦¤à¦¿à¦¯à§à¦¦à§à¦§', 'à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨']
const BASE = 'https://putak-porject-2-1.onrender.com/api'

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
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`} role="navigation" aria-label="à¦ªà§à¦°à¦§à¦¾à¦¨ à¦¨à§‡à¦­à¦¿à¦—à§‡à¦¶à¦¨">
        <div className="nav__inner container">

          {/* Logo */}
          <Link to="/" className="nav__logo" aria-label="à¦ªà§à¦¸à§à¦¤à¦• à¦¹à§‹à¦®">
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
              aria-label="à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} />
            </button>

            <button
              className={`nav__icon-btn nav__icon-btn--badge ${wishOpen ? 'nav__icon-btn--open' : ''}`}
              aria-label={`à¦‰à¦‡à¦¶à¦²à¦¿à¦¸à§à¦Ÿ (${wishItems.length} à¦Ÿà¦¿ à¦¬à¦‡)`}
              aria-expanded={wishOpen}
              data-count={wishItems.length || ''}
              onClick={() => { setWishOpen(!wishOpen); setCartOpen(false); setUserOpen(false) }}
            >
              <Heart size={20} />
            </button>

            <button
              className={`nav__icon-btn nav__icon-btn--badge ${cartOpen ? 'nav__icon-btn--open' : ''}`}
              aria-label={`à¦•à¦¾à¦°à§à¦Ÿ (${cartItems.length} à¦Ÿà¦¿ à¦¬à¦‡)`}
              aria-expanded={cartOpen}
              data-count={cartItems.length || ''}
              onClick={() => { setCartOpen(!cartOpen); setWishOpen(false); setUserOpen(false) }}
            >
              <ShoppingBag size={20} />
            </button>

            <button
              className={`nav__theme-toggle ${isDarkMode ? 'nav__theme-toggle--dark' : ''}`}
              aria-label={isDarkMode ? 'à¦²à¦¾à¦‡à¦Ÿ à¦®à§‹à¦¡ à¦šà¦¾à¦²à§ à¦•à¦°à§à¦¨' : 'à¦¡à¦¾à¦°à§à¦• à¦®à§‹à¦¡ à¦šà¦¾à¦²à§ à¦•à¦°à§à¦¨'}
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
                aria-label="à¦†à¦®à¦¾à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ"
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
                aria-label="à¦²à¦—à¦‡à¦¨ à¦•à¦°à§à¦¨"
              >
                à¦²à¦—à¦‡à¦¨
              </button>
            )}

            <button
              className="nav__hamburger"
              aria-label="à¦®à§‡à¦¨à§"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

      </nav>

      {/* â”€â”€ Cart Drawer â”€â”€ */}
      <Drawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`à¦•à¦¾à¦°à§à¦Ÿ (${cartItems.length})`}
        side="right"
      >
        {cartItems.length === 0 ? (
          <div className="drawer__empty">
            <ShoppingBag size={48} opacity={0.25} />
            <p>à¦•à¦¾à¦°à§à¦Ÿ à¦–à¦¾à¦²à¦¿ à¦†à¦›à§‡</p>
            <button
              className="drawer__cta"
              onClick={() => { setCartOpen(false); navigate('/') }}
            >
              à¦¬à¦‡ à¦•à¦¿à¦¨à§à¦¨
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
                    <span className="drawer__item-price">à§³{b.locked_price}</span>
                  </div>
                  <button
                    className="drawer__item-remove"
                    onClick={() => removeFromCart(b.cart_item_id)}
                    aria-label={`${b.book_name} à¦¸à¦°à¦¾à¦¨`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="drawer__footer">
              <div className="drawer__total">
                <span>à¦®à§‹à¦Ÿ</span>
                <strong>à§³{totalCartPrice}</strong>
              </div>
              <button
                className="drawer__checkout"
                onClick={() => { setCartOpen(false); navigate('/checkout') }}
              >
                à¦šà§‡à¦•à¦†à¦‰à¦Ÿ à¦•à¦°à§à¦¨
              </button>
            </div>
          </>
        )}
      </Drawer>

      {/* â”€â”€ Wishlist Drawer â”€â”€ */}
      <Drawer
        open={wishOpen}
        onClose={() => setWishOpen(false)}
        title={`à¦‰à¦‡à¦¶à¦²à¦¿à¦¸à§à¦Ÿ (${wishItems.length})`}
        side="right"
      >
        {wishItems.length === 0 ? (
          <div className="drawer__empty">
            <Heart size={48} opacity={0.25} />
            <p>à¦‰à¦‡à¦¶à¦²à¦¿à¦¸à§à¦Ÿ à¦–à¦¾à¦²à¦¿ à¦†à¦›à§‡</p>
            <button
              className="drawer__cta"
              onClick={() => { setWishOpen(false); navigate('/') }}
            >
              à¦¬à¦‡ à¦¬à§à¦°à¦¾à¦‰à¦œ à¦•à¦°à§à¦¨
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
                    à§³{b.discount_price ?? b.price}
                  </span>
                </div>
                <button
                  className="drawer__item-remove"
                  onClick={() => toggleWish(b)}
                  aria-label={`${b.book_name} à¦¸à¦°à¦¾à¦¨`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      {/* â”€â”€ User Drawer â”€â”€ */}
      <Drawer
        open={userOpen}
        onClose={() => setUserOpen(false)}
        title="à¦†à¦®à¦¾à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ"
        side="right"
      >
        <div className="user-drawer">
          {authUser ? (
            <>
              {/* â”€â”€ Profile header â”€â”€ */}
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
                  aria-label="à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡ à¦¯à¦¾à¦¨"
                  title="à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡ à¦¯à¦¾à¦¨"
                  onClick={() => { setUserOpen(false); navigate('/account') }}
                >
                  <User size={18} />
                </button>
              </div>

              {/* â”€â”€ Nav links â”€â”€ */}
              <div className="user-drawer__links">
                {[
                  { label: 'à¦†à¦®à¦¾à¦° à¦¤à¦¥à§à¦¯',          to: '/account/profile', icon: User      },
                  { label: 'à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¨',         to: '/account/order',   icon: ShoppingBag },
                  { label: 'à¦…à¦°à§à¦¡à¦¾à¦° à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚',    to: '/account/orders',  icon: Package   },
                  { label: 'à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾',     to: '/account/wishlist', icon: Heart     },
                  { label: 'à¦°à¦¿à¦Ÿà¦¾à¦°à§à¦¨ à¦“ à¦°à¦¿à¦«à¦¾à¦¨à§à¦¡',   to: '/account/returns', icon: RotateCcw },
                  { label: 'à¦°à¦¿à¦­à¦¿à¦‰ à¦“ à¦°à§‡à¦Ÿà¦¿à¦‚',       to: '/account/reviews', icon: Star      },
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
                    à¦²à¦—à¦†à¦‰à¦Ÿ
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="user-drawer__avatar">à¦ªà¦¾</div>
              <p className="user-drawer__name">à¦…à¦¤à¦¿à¦¥à¦¿ à¦ªà¦¾à¦ à¦•</p>
              <div className="user-drawer__links">
                {[
                  { label: 'à¦²à¦—à¦‡à¦¨ à¦•à¦°à§à¦¨',    to: '/login' },
                  { label: 'à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¨ à¦•à¦°à§à¦¨', to: '/register' },
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

      {/* â”€â”€ Mobile Drawer â”€â”€ */}
      <div className={`nav__drawer ${mobileOpen ? 'nav__drawer--open' : ''}`} role="dialog" aria-modal="true">
        <div className="nav__drawer-inner">
          <div className="nav__drawer-header">
            <Link to="/" onClick={() => setMobileOpen(false)}><PustakLogo /></Link>
            <button onClick={() => setMobileOpen(false)} aria-label="à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨">
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
                  à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦² à¦¦à§‡à¦–à§à¦¨
                </Link>
              </div>
            </div>
          ) : (
            <div className="nav__drawer-signin">
              <button
                className="nav__drawer-signin-btn"
                onClick={() => { setMobileOpen(false); navigate('/login') }}
              >
                à¦²à¦—à¦‡à¦¨ à¦•à¦°à§à¦¨
              </button>
              <p className="nav__drawer-signin-text">
                à¦¨à¦¤à§à¦¨ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€? <Link to="/register" onClick={() => setMobileOpen(false)}>à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¨ à¦•à¦°à§à¦¨</Link>
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
                à¦†à¦®à¦¾à¦° à¦¤à¦¥à§à¦¯
              </Link>
              <Link to="/account/order" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¨
              </Link>
              <Link to="/account/orders" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                à¦…à¦°à§à¦¡à¦¾à¦° à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚
              </Link>
              <Link to="/account/wishlist" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾
              </Link>
              <Link to="/account/returns" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                à¦°à¦¿à¦Ÿà¦¾à¦°à§à¦¨ à¦“ à¦°à¦¿à¦«à¦¾à¦¨à§à¦¡
              </Link>
              <Link to="/account/reviews" className="nav__drawer-link" onClick={() => setMobileOpen(false)}>
                à¦°à¦¿à¦­à¦¿à¦‰ à¦“ à¦°à§‡à¦Ÿà¦¿à¦‚
              </Link>
            </div>
          )}
          
          <div className="nav__drawer-footer">
            <button className="nav__drawer-dark-btn" onClick={toggleDarkMode}>
              {isDarkMode ? <><Sun size={16}/> à¦²à¦¾à¦‡à¦Ÿ à¦®à§‹à¦¡</> : <><Moon size={16}/> à¦¡à¦¾à¦°à§à¦• à¦®à§‹à¦¡</>}
            </button>
            {authUser && (
              <button 
                className="nav__drawer-signout-btn"
                onClick={() => { signOut(); setMobileOpen(false); navigate('/') }}
              >
                à¦²à¦—à¦†à¦‰à¦Ÿ
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

      {/* â”€â”€ Search Modal â”€â”€ */}
      {searchOpen && (
        <div className="search-modal" role="dialog" aria-modal="true" aria-label="à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨">
          <div className="search-modal__backdrop" onClick={() => setSearchOpen(false)} />
          <div className="search-modal__box">
            <form className="search-modal__input-wrap" onSubmit={handleSearch}>
              <Search size={22} className="search-modal__icon" />
              <input
                ref={searchRef}
                type="search"
                className="search-modal__input"
                placeholder="à¦¬à¦‡, à¦²à§‡à¦–à¦• à¦¬à¦¾ à¦¬à¦¿à¦­à¦¾à¦— à¦–à§à¦à¦œà§à¦¨..."
                aria-label="à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="search-modal__submit" aria-label="à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨ à¦•à¦°à§à¦¨">
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="search-modal__close"
                onClick={() => setSearchOpen(false)}
                aria-label="à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨"
              >
                <X size={20} />
              </button>
            </form>
            {query.trim().length >= 2 ? (
              <div className="search-modal__results" role="listbox" aria-label="à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨ à¦«à¦²à¦¾à¦«à¦²">
                {searchLoading && <p className="search-modal__status">à¦–à§à¦à¦œà¦›à¦¿...</p>}
                {!searchLoading && searchResults.length === 0 && (
                  <p className="search-modal__status">à¦•à§‹à¦¨à§‹ à¦«à¦²à¦¾à¦«à¦² à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤</p>
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
                      : <span className="search-modal__result-cover search-modal__result-cover--fallback">à¦¬à¦‡</span>
                    }
                    <span className="search-modal__result-info">
                      <strong>{book.book_name}</strong>
                      <span>{book.author || book.authors?.[0]?.name || ''}</span>
                    </span>
                    <span className="search-modal__result-type">à¦¬à¦‡</span>
                  </button>
                ))}
                {!searchLoading && searchResults.length > 0 && (
                  <button type="submit" className="search-modal__all">
                    "{query.trim()}" â€” à¦¸à¦¬ à¦«à¦²à¦¾à¦«à¦² à¦¦à§‡à¦–à§à¦¨ â†’
                  </button>
                )}
              </div>
            ) : (
              <div className="search-modal__trending">
                <p className="search-modal__label">à¦Ÿà§à¦°à§‡à¦¨à§à¦¡à¦¿à¦‚ à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨</p>
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

/* â”€â”€ Reusable Drawer â”€â”€ */
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
        <button className="side-drawer__close" onClick={onClose} aria-label="à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨">
          <X size={20} />
        </button>
      </div>
      <div className="side-drawer__body">{children}</div>
    </div>
  )
}

/* â”€â”€ Logo â”€â”€ */
function PustakLogo() {
  return (
    <div className="pustak-logo" aria-label="à¦ªà§à¦¸à§à¦¤à¦•">
      <svg width="110" height="44" viewBox="0 0 110 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 36 Q30 40 55 38 Q80 36 102 39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
        <path d="M46 4 Q55 1 64 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
        <text x="55" y="30" textAnchor="middle" fontFamily="'Noto Serif Bengali', 'Tiro Bangla', serif" fontWeight="700" fontSize="26" fill="currentColor" letterSpacing="1">à¦ªà§à¦¸à§à¦¤à¦•</text>
        <circle cx="55" cy="6" r="1.5" fill="currentColor" opacity="0.6"/>
      </svg>
    </div>
  )
}

