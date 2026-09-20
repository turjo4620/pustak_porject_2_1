import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, BookOpen } from 'lucide-react'
import BookCard from '../components/BookCard'
import HoverTooltip from '../components/HoverTooltip'
import './ListPage.css'
import './BestSellersPage.css'

// ── Bengali numeral helper ────────────────────────────────────────
const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

// ── Sort options ──────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'popularity',  label: 'জনপিয়তা'            },
  { value: 'newest',      label: 'নতুন প্রকাশিত'       },
  { value: 'price_asc',   label: 'মূল্য: কম থেকে বেশি' },
  { value: 'price_desc',  label: 'মূল্য: বেশি থেকে কম' },
  { value: 'discount',    label: 'সর্বোচ্চ ছাড়'        },
]

const BOOKS_PER_PAGE = 20

// ── Collapsible sidebar section ───────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bsp__filter-section">
      <button
        className="bsp__filter-section-head"
        onClick={() => setOpen((o) => !o)}
        type="button"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="bsp__filter-section-body">{children}</div>}
    </div>
  )
}

// ── Price range dual-handle slider ────────────────────────────────
function PriceSlider({ min, max, value, onChange }) {
  const rangeRef = useRef(null)
  const pct = (v) => ((v - min) / (max - min)) * 100

  const handleLow  = (e) => onChange([Math.min(Number(e.target.value), value[1] - 1), value[1]])
  const handleHigh = (e) => onChange([value[0], Math.max(Number(e.target.value), value[0] + 1)])

  return (
    <div className="bsp__price-slider">
      <div className="bsp__price-track" ref={rangeRef}>
        <div
          className="bsp__price-fill"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />
        <input type="range" min={min} max={max} value={value[0]} onChange={handleLow}
          className="bsp__range bsp__range--low"  aria-label="সর্বনিম্ন মূল্য" />
        <input type="range" min={min} max={max} value={value[1]} onChange={handleHigh}
          className="bsp__range bsp__range--high" aria-label="সর্বোচ্চ মূল্য" />
      </div>
      <div className="bsp__price-inputs">
        <label className="bsp__price-input-wrap">
          <span>৳</span>
          <input type="number" min={min} max={value[1] - 1} value={value[0]}
            onChange={(e) => onChange([Math.max(min, Math.min(Number(e.target.value), value[1] - 1)), value[1]])}
            className="bsp__price-input" aria-label="সর্বনিম্ন মূল্য ইনপুট" />
        </label>
        <span className="bsp__price-dash">–</span>
        <label className="bsp__price-input-wrap">
          <span>৳</span>
          <input type="number" min={value[0] + 1} max={max} value={value[1]}
            onChange={(e) => onChange([value[0], Math.min(max, Math.max(Number(e.target.value), value[0] + 1))])}
            className="bsp__price-input" aria-label="সর্বোচ্চ মূল্য ইনপুট" />
        </label>
      </div>
    </div>
  )
}

// ── Per-kind fetch caches (module-level — survive re-renders) ─────
const authorCache = new Map()   // name  → { name, bio, photo_url, count }
const pubCache    = new Map()   // title → { title, bio, cover_image_url, book_count }

async function fetchAuthor(name) {
  if (authorCache.has(name)) return authorCache.get(name)
  try {
    const res  = await fetch(`http://localhost:5000/api/authors/by-name/${encodeURIComponent(name)}`)
    const json = await res.json()
    const data = json.data || null
    authorCache.set(name, data)
    return data
  } catch {
    authorCache.set(name, null)
    return null
  }
}

async function fetchPublication(title) {
  if (pubCache.has(title)) return pubCache.get(title)
  try {
    const res  = await fetch(`http://localhost:5000/api/publications/by-title/${encodeURIComponent(title)}`)
    const json = await res.json()
    const data = json.data || null
    pubCache.set(title, data)
    return data
  } catch {
    pubCache.set(title, null)
    return null
  }
}

// ── Main page ─────────────────────────────────────────────────────
export default function BestSellersPage() {
  const [allBooks,  setAllBooks]  = useState([])
  const [loading,   setLoading]   = useState(true)

  // ── Filter state ──────────────────────────────────────────────
  const [sortBy,        setSortBy]        = useState('popularity')
  const [selCategories, setSelCategories] = useState([])
  const [authorSearch,  setAuthorSearch]  = useState('')
  const [selAuthors,    setSelAuthors]    = useState([])
  const [selPublishers, setSelPublishers] = useState([])
  const [priceRange,    setPriceRange]    = useState([0, 2000])
  const [inStockOnly,   setInStockOnly]   = useState(false)
  const [page,          setPage]          = useState(1)
  const [mobileOpen,    setMobileOpen]    = useState(false)

  // ── Single shared tooltip state ───────────────────────────────
  // null = hidden; object = visible with data + position
  const [hoveredItem, setHoveredItem] = useState(null)
  const hoverTimer  = useRef(null)
  const leaveTimer  = useRef(null)

  // ── Fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch('http://localhost:5000/api/books/bestsellers?limit=200')
        const data = await res.json()
        setAllBooks(data.data || [])
      } catch (err) {
        console.error('Error fetching bestsellers:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── Derived facets ────────────────────────────────────────────
  const maxPrice = useMemo(() => {
    const m = Math.max(...allBooks.map((b) => Number(b.price) || 0), 2000)
    return Math.ceil(m / 100) * 100
  }, [allBooks])

  useEffect(() => {
    if (maxPrice > 2000) setPriceRange([0, maxPrice])
  }, [maxPrice])

  const categories = useMemo(() => {
    const map = {}
    allBooks.forEach((b) => { if (b.category) map[b.category] = (map[b.category] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allBooks])

  const authors = useMemo(() => {
    const map = {}
    allBooks.forEach((b) => { if (b.author) map[b.author] = (map[b.author] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allBooks])

  const publishers = useMemo(() => {
    const map = {}
    allBooks.forEach((b) => {
      const p = b.publisher || b.publication_name
      if (p) map[p] = (map[p] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allBooks])

  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return authors
    const q = authorSearch.toLowerCase()
    return authors.filter(([name]) => name.toLowerCase().includes(q))
  }, [authors, authorSearch])

  // ── Filters + sort ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let books = [...allBooks]
    if (selCategories.length) books = books.filter((b) => selCategories.includes(b.category))
    if (selAuthors.length)    books = books.filter((b) => selAuthors.includes(b.author))
    if (selPublishers.length) books = books.filter((b) => selPublishers.includes(b.publisher || b.publication_name))
    books = books.filter((b) => { const p = Number(b.price) || 0; return p >= priceRange[0] && p <= priceRange[1] })
    if (inStockOnly) books = books.filter((b) => b.inStock !== false)
    switch (sortBy) {
      case 'newest':     books.sort((a, b) => new Date(b.published_date || 0) - new Date(a.published_date || 0)); break
      case 'price_asc':  books.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break
      case 'price_desc': books.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)); break
      case 'discount':   books.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0)); break
      default: break
    }
    return books
  }, [allBooks, selCategories, selAuthors, selPublishers, priceRange, inStockOnly, sortBy])

  useEffect(() => { setPage(1) }, [selCategories, selAuthors, selPublishers, priceRange, inStockOnly, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE))
  const pageBooks  = filtered.slice((page - 1) * BOOKS_PER_PAGE, page * BOOKS_PER_PAGE)

  // ── Active chips ──────────────────────────────────────────────
  const chips = useMemo(() => {
    const list = []
    selCategories.forEach((c) => list.push({ label: c, remove: () => setSelCategories((p) => p.filter((x) => x !== c)) }))
    selAuthors.forEach((a)    => list.push({ label: a, remove: () => setSelAuthors((p) => p.filter((x) => x !== a)) }))
    selPublishers.forEach((p) => list.push({ label: p, remove: () => setSelPublishers((prev) => prev.filter((x) => x !== p)) }))
    if (priceRange[0] > 0 || priceRange[1] < maxPrice)
      list.push({ label: `৳${toBn(priceRange[0])}–৳${toBn(priceRange[1])}`, remove: () => setPriceRange([0, maxPrice]) })
    if (inStockOnly) list.push({ label: 'ইন-স্টক', remove: () => setInStockOnly(false) })
    return list
  }, [selCategories, selAuthors, selPublishers, priceRange, inStockOnly, maxPrice])

  const clearAll = useCallback(() => {
    setSelCategories([]); setSelAuthors([]); setSelPublishers([])
    setPriceRange([0, maxPrice]); setInStockOnly(false); setSortBy('popularity'); setPage(1)
  }, [maxPrice])

  const hasFilters = chips.length > 0

  const toggleItem = (setter, value) =>
    setter((prev) => prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value])

  // ── Pagination ─────────────────────────────────────────────────
  const pageNums = useMemo(() => {
    const delta = 2, range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i)
    if (range[0] > 1) range.unshift('…', 1)
    if (range[range.length - 1] < totalPages) range.push('…', totalPages)
    return [...new Set(range)]
  }, [page, totalPages])

  // ── Single-tooltip hover handlers ─────────────────────────────
  //
  // Pattern: on mouseenter, wait 180 ms, then fetch data and show
  // the tooltip.  On mouseleave, cancel any pending open and hide
  // after 60 ms (enough time to move onto adjacent rows without flicker).
  //
  // Because both author and publication lists call the same two setters
  // (setHoveredItem / clearTimeout) there is exactly ONE tooltip in the
  // DOM at any time regardless of which list the user is hovering.

  const handleAuthorEnter = useCallback((e, name) => {
    clearTimeout(leaveTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    hoverTimer.current = setTimeout(async () => {
      const data = await fetchAuthor(name)
      setHoveredItem({
        visible  : true,
        kind     : 'author',
        title    : data?.name  ?? name,
        bio      : data?.bio   ?? null,
        image    : data?.photo_url ?? null,
        count    : data?.count ?? null,
        x        : rect.right,
        y        : rect.top,
        triggerH : rect.height,
      })
    }, 180)
  }, [])

  const handlePubEnter = useCallback((e, title) => {
    clearTimeout(leaveTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    hoverTimer.current = setTimeout(async () => {
      const data = await fetchPublication(title)
      setHoveredItem({
        visible  : true,
        kind     : 'publication',
        title    : data?.title          ?? title,
        bio      : data?.bio            ?? null,
        image    : data?.cover_image_url ?? null,
        count    : data?.book_count     ?? null,
        x        : rect.right,
        y        : rect.top,
        triggerH : rect.height,
      })
    }, 180)
  }, [])

  const handleItemLeave = useCallback(() => {
    clearTimeout(hoverTimer.current)
    leaveTimer.current = setTimeout(() => setHoveredItem(null), 60)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(hoverTimer.current)
    clearTimeout(leaveTimer.current)
  }, [])

  // ── Filter sidebar (shared desktop + drawer) ──────────────────
  const filterSidebar = (
    <div className="bsp__sidebar-inner">
      <div className="bsp__sidebar-head">
        <span className="bsp__sidebar-title">ফিল্টার</span>
        {hasFilters && (
          <button className="bsp__clear-all" onClick={clearAll} type="button">সব মুছুন</button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="বিষয় / ক্যাটাগরি">
        <ul className="bsp__check-list">
          {categories.map(([cat, count]) => (
            <li key={cat}>
              <label className="bsp__check-row">
                <input type="checkbox" checked={selCategories.includes(cat)}
                  onChange={() => toggleItem(setSelCategories, cat)} />
                <span className="bsp__check-label">{cat}</span>
                <span className="bsp__check-count">{toBn(count)}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Authors — hover fires on the <li> */}
      <FilterSection title="লেখক">
        <div className="bsp__author-search-wrap">
          <Search size={13} className="bsp__author-search-icon" />
          <input
            className="bsp__author-search"
            placeholder="লেখক খুঁজুন..."
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
          />
        </div>
        <ul className="bsp__check-list bsp__check-list--scroll">
          {filteredAuthors.map(([name, count]) => (
            <li
              key={name}
              onMouseEnter={(e) => handleAuthorEnter(e, name)}
              onMouseLeave={handleItemLeave}
            >
              <label className="bsp__check-row">
                <input type="checkbox" checked={selAuthors.includes(name)}
                  onChange={() => toggleItem(setSelAuthors, name)} />
                <span className="bsp__check-label">{name}</span>
                <span className="bsp__check-count">{toBn(count)}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Publishers — hover fires on the <li> */}
      {publishers.length > 0 && (
        <FilterSection title="প্রকাশক" defaultOpen={false}>
          <ul className="bsp__check-list bsp__check-list--scroll">
            {publishers.map(([pub, count]) => (
              <li
                key={pub}
                onMouseEnter={(e) => handlePubEnter(e, pub)}
                onMouseLeave={handleItemLeave}
              >
                <label className="bsp__check-row">
                  <input type="checkbox" checked={selPublishers.includes(pub)}
                    onChange={() => toggleItem(setSelPublishers, pub)} />
                  <span className="bsp__check-label">{pub}</span>
                  <span className="bsp__check-count">{toBn(count)}</span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Price range */}
      <FilterSection title="মূল্য পরিসীমা">
        <PriceSlider min={0} max={maxPrice} value={priceRange} onChange={setPriceRange} />
      </FilterSection>

      {/* In-stock toggle */}
      <FilterSection title="স্টক স্ট্যাটাস">
        <label className="bsp__toggle-row">
          <span className="bsp__toggle-label">শুধু ইন-স্টক বই</span>
          <button type="button" role="switch" aria-checked={inStockOnly}
            className={`bsp__toggle ${inStockOnly ? 'bsp__toggle--on' : ''}`}
            onClick={() => setInStockOnly((v) => !v)}>
            <span className="bsp__toggle-thumb" />
          </button>
        </label>
      </FilterSection>
    </div>
  )

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="list-page">
        <div className="container">
          <p className="bsp__loading">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="list-page bsp__page">
      <div className="container">

        {/* Header */}
        <div className="list-page__header">
          <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › বেস্টসেলার</p>
          <h1 className="list-page__title">বেস্টসেলার বই</h1>
          <p className="list-page__count">সবচেয়ে বেশি পড়া {toBn(filtered.length)} টি বই</p>
        </div>

        {/* Active chips */}
        {chips.length > 0 && (
          <div className="bsp__chips-bar" role="list" aria-label="সক্রিয় ফিল্টার">
            {chips.map((chip, i) => (
              <span key={i} className="bsp__chip" role="listitem">
                {chip.label}
                <button className="bsp__chip-remove" onClick={chip.remove}
                  aria-label={`${chip.label} ফিল্টার সরান`}>
                  <X size={11} />
                </button>
              </span>
            ))}
            <button className="bsp__chip-clear-all" onClick={clearAll} type="button">সব মুছুন</button>
          </div>
        )}

        {/* Layout */}
        <div className="bsp__layout">
          <aside className="bsp__sidebar" aria-label="ফিল্টার প্যানেল">
            {filterSidebar}
          </aside>

          <div className="bsp__content">
            {/* Sort bar */}
            <div className="bsp__sort-bar">
              <span className="bsp__result-count">{toBn(filtered.length)} টি বই পাওয়া গেছে</span>
              <div className="bsp__sort-wrap">
                <label htmlFor="bsp-sort" className="bsp__sort-label">সর্ট করুন:</label>
                <select id="bsp-sort" className="bsp__sort-select" value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bsp__empty">
                <BookOpen size={56} className="bsp__empty-icon" />
                <p className="bsp__empty-msg">কোনো বই পাওয়া যায়নি</p>
                <p className="bsp__empty-hint">অন্য ফিল্টার ব্যবহার করে দেখুন</p>
                <button className="bsp__empty-reset" onClick={clearAll} type="button">
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              <>
                <div className="list-page__grid">
                  {pageBooks.map((b) => <BookCard key={b.id} book={b} />)}
                </div>

                {totalPages > 1 && (
                  <nav className="bsp__pagination" aria-label="পেজিনেশন">
                    <button className="bsp__page-btn"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1} aria-label="আগের পেজ">‹</button>

                    {pageNums.map((n, i) =>
                      n === '…' ? (
                        <span key={`e-${i}`} className="bsp__page-ellipsis">…</span>
                      ) : (
                        <button key={n}
                          className={`bsp__page-btn ${page === n ? 'bsp__page-btn--active' : ''}`}
                          onClick={() => setPage(n)}
                          aria-label={`পেজ ${toBn(n)}`}
                          aria-current={page === n ? 'page' : undefined}>
                          {toBn(n)}
                        </button>
                      )
                    )}

                    <button className="bsp__page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages} aria-label="পরের পেজ">›</button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="bsp__mobile-bar">
        <button className="bsp__mobile-filter-btn" onClick={() => setMobileOpen(true)}
          type="button" aria-haspopup="dialog">
          <SlidersHorizontal size={16} />
          ফিল্টার ও সর্ট
          {hasFilters && <span className="bsp__mobile-badge">{toBn(chips.length)}</span>}
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div className="bsp__drawer-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <div className={`bsp__drawer ${mobileOpen ? 'bsp__drawer--open' : ''}`}
        role="dialog" aria-modal="true" aria-label="ফিল্টার ও সর্ট">
        <div className="bsp__drawer-header">
          <span className="bsp__drawer-title">ফিল্টার ও সর্ট</span>
          <button className="bsp__drawer-close" onClick={() => setMobileOpen(false)}
            aria-label="ড্রয়ার বন্ধ করুন">
            <X size={20} />
          </button>
        </div>

        <div className="bsp__drawer-sort">
          <span className="bsp__sort-label">সর্ট করুন</span>
          <div className="bsp__drawer-sort-options">
            {SORT_OPTIONS.map((o) => (
              <button key={o.value} type="button"
                className={`bsp__drawer-sort-opt ${sortBy === o.value ? 'bsp__drawer-sort-opt--active' : ''}`}
                onClick={() => setSortBy(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bsp__drawer-body">{filterSidebar}</div>

        <div className="bsp__drawer-footer">
          <button className="bsp__drawer-apply" onClick={() => setMobileOpen(false)} type="button">
            {toBn(filtered.length)} টি বই দেখুন
          </button>
        </div>
      </div>

      {/* ── Single shared tooltip — portalled to <body> ── */}
      <HoverTooltip item={hoveredItem} />
    </div>
  )
}
