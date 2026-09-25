import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, BookOpen } from 'lucide-react'
import BookCard from './BookCard'
import HoverTooltip from './HoverTooltip'
import useCatalogBooks from '../hooks/useCatalogBooks'
import '../pages/BestSellersPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

const DEFAULT_SORT_OPTIONS = [
  { value: 'popularity',  label: 'জনপিয়তা'            },
  { value: 'newest',      label: 'নতুন প্রকাশিত'       },
  { value: 'price_asc',   label: 'মূল্য: কম থেকে বেশি' },
  { value: 'price_desc',  label: 'মূল্য: বেশি থেকে কম' },
  { value: 'discount',    label: 'সর্বোচ্চ ছাড়'        },
  { value: 'rating',      label: 'সর্বোচ্চ রেটিং'       },
]

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
const authorCache = new Map()
const pubCache    = new Map()

async function fetchAuthor(name) {
  if (authorCache.has(name)) return authorCache.get(name)
  try {
    const res  = await fetch(`https://putak-porject-2-1.onrender.com/api/authors/by-name/${encodeURIComponent(name)}`)
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
    const res  = await fetch(`https://putak-porject-2-1.onrender.com/api/publications/by-title/${encodeURIComponent(title)}`)
    const json = await res.json()
    const data = json.data || null
    pubCache.set(title, data)
    return data
  } catch {
    pubCache.set(title, null)
    return null
  }
}

/**
 * Unified server-filtered book list used by every customer list page.
 *
 * Props:
 *  - scope: 'bestsellers' | 'new_arrivals' | 'offers' | undefined
 *  - q: search term (string)
 *  - authorId / categoryId / publisherId: locked dimension (page context)
 *  - minPct: minimum discount for the offers scope
 *  - renderHeader: ({ total, loading }) => ReactNode
 *  - sortOptions / defaultSort: optional overrides
 *  - limit: page size (default 20)
 */
export default function FilteredBookList({
  scope, q = '', authorId, categoryId, publisherId, minPct = 1,
  renderHeader, sortOptions = DEFAULT_SORT_OPTIONS, defaultSort,
  limit = 20, className = '',
}) {
  const [sortBy,        setSortBy]        = useState(defaultSort || (scope === 'new_arrivals' ? 'newest' : scope === 'offers' ? 'discount' : 'popularity'))
  const [selCategories, setSelCategories] = useState([])   // ids
  const [selAuthors,    setSelAuthors]    = useState([])   // ids
  const [selPublishers, setSelPublishers] = useState([])   // ids
  const [priceRange,    setPriceRange]    = useState(null) // null = unfiltered
  const [inStockOnly,   setInStockOnly]   = useState(false)
  const [page,          setPage]          = useState(1)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [authorSearch,  setAuthorSearch]  = useState('')

  const { books, total, totalPages, facets, priceBounds, loading, error } =
    useCatalogBooks({
      scope, q, authorId, categoryId, publisherId, minPct, limit,
      categoryIds: selCategories, authorIds: selAuthors, publisherIds: selPublishers,
      priceMin: priceRange ? priceRange[0] : null,
      priceMax: priceRange ? priceRange[1] : null,
      inStock: inStockOnly, sort: sortBy, page,
    })

  const sliderValue = priceRange || [priceBounds.min, priceBounds.max]

  // Reset pagination when any filter changes
  useEffect(() => { setPage(1) }, [selCategories, selAuthors, selPublishers, priceRange, inStockOnly, sortBy, q, scope])

  const facetById = useMemo(() => ({
    categories: new Map(facets.categories.map((f) => [f.id, f])),
    authors:    new Map(facets.authors.map((f) => [f.id, f])),
    publishers: new Map(facets.publishers.map((f) => [f.id, f])),
  }), [facets])

  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return facets.authors
    const s = authorSearch.toLowerCase()
    return facets.authors.filter((a) => a.name.toLowerCase().includes(s))
  }, [facets.authors, authorSearch])

  // ── Active chips ──────────────────────────────────────────────
  const chips = useMemo(() => {
    const list = []
    selCategories.forEach((id) => {
      const f = facetById.categories.get(id)
      if (f) list.push({ label: f.name, remove: () => setSelCategories((p) => p.filter((x) => x !== id)) })
    })
    selAuthors.forEach((id) => {
      const f = facetById.authors.get(id)
      if (f) list.push({ label: f.name, remove: () => setSelAuthors((p) => p.filter((x) => x !== id)) })
    })
    selPublishers.forEach((id) => {
      const f = facetById.publishers.get(id)
      if (f) list.push({ label: f.name, remove: () => setSelPublishers((p) => p.filter((x) => x !== id)) })
    })
    if (priceRange) {
      list.push({
        label: `৳${toBn(priceRange[0])}–৳${toBn(priceRange[1])}`,
        remove: () => setPriceRange(null),
      })
    }
    if (inStockOnly) list.push({ label: 'ইন-স্টক', remove: () => setInStockOnly(false) })
    return list
  }, [selCategories, selAuthors, selPublishers, priceRange, inStockOnly, facetById])

  const clearAll = useCallback(() => {
    setSelCategories([]); setSelAuthors([]); setSelPublishers([])
    setPriceRange(null); setInStockOnly(false)
  }, [])

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

  // ── Single shared tooltip state ───────────────────────────────
  const [hoveredItem, setHoveredItem] = useState(null)
  const hoverTimer  = useRef(null)
  const leaveTimer  = useRef(null)

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
      {facets.categories.length > 0 && (
        <FilterSection title="বিষয় / ক্যাটাগরি">
          <ul className="bsp__check-list">
            {facets.categories.map((f) => (
              <li key={f.id}>
                <label className="bsp__check-row">
                  <input type="checkbox" checked={selCategories.includes(f.id)}
                    onChange={() => toggleItem(setSelCategories, f.id)} />
                  <span className="bsp__check-label">{f.name}</span>
                  <span className="bsp__check-count">{toBn(f.count)}</span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Authors — hover fires on the <li> */}
      {facets.authors.length > 0 && (
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
            {filteredAuthors.map((f) => (
              <li
                key={f.id}
                onMouseEnter={(e) => handleAuthorEnter(e, f.name)}
                onMouseLeave={handleItemLeave}
              >
                <label className="bsp__check-row">
                  <input type="checkbox" checked={selAuthors.includes(f.id)}
                    onChange={() => toggleItem(setSelAuthors, f.id)} />
                  <span className="bsp__check-label">{f.name}</span>
                  <span className="bsp__check-count">{toBn(f.count)}</span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Publishers — hover fires on the <li> */}
      {facets.publishers.length > 0 && (
        <FilterSection title="প্রকাশক" defaultOpen={false}>
          <ul className="bsp__check-list bsp__check-list--scroll">
            {facets.publishers.map((f) => (
              <li
                key={f.id}
                onMouseEnter={(e) => handlePubEnter(e, f.name)}
                onMouseLeave={handleItemLeave}
              >
                <label className="bsp__check-row">
                  <input type="checkbox" checked={selPublishers.includes(f.id)}
                    onChange={() => toggleItem(setSelPublishers, f.id)} />
                  <span className="bsp__check-label">{f.name}</span>
                  <span className="bsp__check-count">{toBn(f.count)}</span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Price range */}
      <FilterSection title="মূল্য পরিসীমা">
        <PriceSlider
          min={priceBounds.min}
          max={Math.max(priceBounds.max, priceBounds.min + 1)}
          value={[sliderValue[0], Math.min(sliderValue[1], Math.max(priceBounds.max, priceBounds.min + 1))]}
          onChange={(v) => {
            // Treat slider-at-bounds as "no filter"
            if (v[0] <= priceBounds.min && v[1] >= priceBounds.max) setPriceRange(null)
            else setPriceRange(v)
          }}
        />
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

  return (
    <div className={`list-page bsp__page ${className}`.trim()}>
      <div className="container">

        {renderHeader && renderHeader({ total, loading })}

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
              <span className="bsp__result-count">{toBn(total)} টি বই পাওয়া গেছে</span>
              <div className="bsp__sort-wrap">
                <label htmlFor="bsp-sort" className="bsp__sort-label">সর্ট করুন:</label>
                <select id="bsp-sort" className="bsp__sort-select" value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}>
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <p className="bsp__loading">{error}</p>
            ) : loading ? (
              <p className="bsp__loading">লোড হচ্ছে...</p>
            ) : total === 0 ? (
              <div className="bsp__empty">
                <BookOpen size={56} className="bsp__empty-icon" />
                <p className="bsp__empty-msg">কোনো বই পাওয়া যায়নি</p>
                <p className="bsp__empty-hint">অন্য ফিল্টার ব্যবহার করে দেখুন</p>
                {hasFilters && (
                  <button className="bsp__empty-reset" onClick={clearAll} type="button">
                    ফিল্টার রিসেট করুন
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`list-page__grid ${loading ? 'bsp__grid--loading' : ''}`}>
                  {books.map((b) => <BookCard key={b.id} book={b} />)}
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
            {sortOptions.map((o) => (
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
            {toBn(total)} টি বই দেখুন
          </button>
        </div>
      </div>

      {/* ── Single shared tooltip — portalled to <body> ── */}
      <HoverTooltip item={hoveredItem} />
    </div>
  )
}
