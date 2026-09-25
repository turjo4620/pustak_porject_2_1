import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, BookOpen } from 'lucide-react'
import BookCard from './BookCard'
import HoverTooltip from './HoverTooltip'
import useCatalogBooks from '../hooks/useCatalogBooks'
import '../pages/BestSellersPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])

const DEFAULT_SORT_OPTIONS = [
  { value: 'popularity',  label: 'à¦œà¦¨à¦ªà¦¿à¦¯à¦¼à¦¤à¦¾'            },
  { value: 'newest',      label: 'à¦¨à¦¤à§à¦¨ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¿à¦¤'       },
  { value: 'price_asc',   label: 'à¦®à§‚à¦²à§à¦¯: à¦•à¦® à¦¥à§‡à¦•à§‡ à¦¬à§‡à¦¶à¦¿' },
  { value: 'price_desc',  label: 'à¦®à§‚à¦²à§à¦¯: à¦¬à§‡à¦¶à¦¿ à¦¥à§‡à¦•à§‡ à¦•à¦®' },
  { value: 'discount',    label: 'à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦›à¦¾à¦¡à¦¼'        },
  { value: 'rating',      label: 'à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦°à§‡à¦Ÿà¦¿à¦‚'       },
]

// â”€â”€ Collapsible sidebar section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Price range dual-handle slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          className="bsp__range bsp__range--low"  aria-label="à¦¸à¦°à§à¦¬à¦¨à¦¿à¦®à§à¦¨ à¦®à§‚à¦²à§à¦¯" />
        <input type="range" min={min} max={max} value={value[1]} onChange={handleHigh}
          className="bsp__range bsp__range--high" aria-label="à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦®à§‚à¦²à§à¦¯" />
      </div>
      <div className="bsp__price-inputs">
        <label className="bsp__price-input-wrap">
          <span>à§³</span>
          <input type="number" min={min} max={value[1] - 1} value={value[0]}
            onChange={(e) => onChange([Math.max(min, Math.min(Number(e.target.value), value[1] - 1)), value[1]])}
            className="bsp__price-input" aria-label="à¦¸à¦°à§à¦¬à¦¨à¦¿à¦®à§à¦¨ à¦®à§‚à¦²à§à¦¯ à¦‡à¦¨à¦ªà§à¦Ÿ" />
        </label>
        <span className="bsp__price-dash">â€“</span>
        <label className="bsp__price-input-wrap">
          <span>à§³</span>
          <input type="number" min={value[0] + 1} max={max} value={value[1]}
            onChange={(e) => onChange([value[0], Math.min(max, Math.max(Number(e.target.value), value[0] + 1))])}
            className="bsp__price-input" aria-label="à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦®à§‚à¦²à§à¦¯ à¦‡à¦¨à¦ªà§à¦Ÿ" />
        </label>
      </div>
    </div>
  )
}

// â”€â”€ Per-kind fetch caches (module-level â€” survive re-renders) â”€â”€â”€â”€â”€
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

  // â”€â”€ Active chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        label: `à§³${toBn(priceRange[0])}â€“à§³${toBn(priceRange[1])}`,
        remove: () => setPriceRange(null),
      })
    }
    if (inStockOnly) list.push({ label: 'à¦‡à¦¨-à¦¸à§à¦Ÿà¦•', remove: () => setInStockOnly(false) })
    return list
  }, [selCategories, selAuthors, selPublishers, priceRange, inStockOnly, facetById])

  const clearAll = useCallback(() => {
    setSelCategories([]); setSelAuthors([]); setSelPublishers([])
    setPriceRange(null); setInStockOnly(false)
  }, [])

  const hasFilters = chips.length > 0

  const toggleItem = (setter, value) =>
    setter((prev) => prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value])

  // â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pageNums = useMemo(() => {
    const delta = 2, range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i)
    if (range[0] > 1) range.unshift('â€¦', 1)
    if (range[range.length - 1] < totalPages) range.push('â€¦', totalPages)
    return [...new Set(range)]
  }, [page, totalPages])

  // â”€â”€ Single shared tooltip state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Filter sidebar (shared desktop + drawer) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filterSidebar = (
    <div className="bsp__sidebar-inner">
      <div className="bsp__sidebar-head">
        <span className="bsp__sidebar-title">à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦°</span>
        {hasFilters && (
          <button className="bsp__clear-all" onClick={clearAll} type="button">à¦¸à¦¬ à¦®à§à¦›à§à¦¨</button>
        )}
      </div>

      {/* Category */}
      {facets.categories.length > 0 && (
        <FilterSection title="à¦¬à¦¿à¦·à¦¯à¦¼ / à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿">
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

      {/* Authors â€” hover fires on the <li> */}
      {facets.authors.length > 0 && (
        <FilterSection title="à¦²à§‡à¦–à¦•">
          <div className="bsp__author-search-wrap">
            <Search size={13} className="bsp__author-search-icon" />
            <input
              className="bsp__author-search"
              placeholder="à¦²à§‡à¦–à¦• à¦–à§à¦à¦œà§à¦¨..."
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

      {/* Publishers â€” hover fires on the <li> */}
      {facets.publishers.length > 0 && (
        <FilterSection title="à¦ªà§à¦°à¦•à¦¾à¦¶à¦•" defaultOpen={false}>
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
      <FilterSection title="à¦®à§‚à¦²à§à¦¯ à¦ªà¦°à¦¿à¦¸à§€à¦®à¦¾">
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
      <FilterSection title="à¦¸à§à¦Ÿà¦• à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸">
        <label className="bsp__toggle-row">
          <span className="bsp__toggle-label">à¦¶à§à¦§à§ à¦‡à¦¨-à¦¸à§à¦Ÿà¦• à¦¬à¦‡</span>
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
          <div className="bsp__chips-bar" role="list" aria-label="à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦°">
            {chips.map((chip, i) => (
              <span key={i} className="bsp__chip" role="listitem">
                {chip.label}
                <button className="bsp__chip-remove" onClick={chip.remove}
                  aria-label={`${chip.label} à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦¸à¦°à¦¾à¦¨`}>
                  <X size={11} />
                </button>
              </span>
            ))}
            <button className="bsp__chip-clear-all" onClick={clearAll} type="button">à¦¸à¦¬ à¦®à§à¦›à§à¦¨</button>
          </div>
        )}

        {/* Layout */}
        <div className="bsp__layout">
          <aside className="bsp__sidebar" aria-label="à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²">
            {filterSidebar}
          </aside>

          <div className="bsp__content">
            {/* Sort bar */}
            <div className="bsp__sort-bar">
              <span className="bsp__result-count">{toBn(total)} à¦Ÿà¦¿ à¦¬à¦‡ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦—à§‡à¦›à§‡</span>
              <div className="bsp__sort-wrap">
                <label htmlFor="bsp-sort" className="bsp__sort-label">à¦¸à¦°à§à¦Ÿ à¦•à¦°à§à¦¨:</label>
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
              <p className="bsp__loading">à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>
            ) : total === 0 ? (
              <div className="bsp__empty">
                <BookOpen size={56} className="bsp__empty-icon" />
                <p className="bsp__empty-msg">à¦•à§‹à¦¨à§‹ à¦¬à¦‡ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿</p>
                <p className="bsp__empty-hint">à¦…à¦¨à§à¦¯ à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§‡ à¦¦à§‡à¦–à§à¦¨</p>
                {hasFilters && (
                  <button className="bsp__empty-reset" onClick={clearAll} type="button">
                    à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à§à¦¨
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`list-page__grid ${loading ? 'bsp__grid--loading' : ''}`}>
                  {books.map((b) => <BookCard key={b.id} book={b} />)}
                </div>

                {totalPages > 1 && (
                  <nav className="bsp__pagination" aria-label="à¦ªà§‡à¦œà¦¿à¦¨à§‡à¦¶à¦¨">
                    <button className="bsp__page-btn"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1} aria-label="à¦†à¦—à§‡à¦° à¦ªà§‡à¦œ">â€¹</button>

                    {pageNums.map((n, i) =>
                      n === 'â€¦' ? (
                        <span key={`e-${i}`} className="bsp__page-ellipsis">â€¦</span>
                      ) : (
                        <button key={n}
                          className={`bsp__page-btn ${page === n ? 'bsp__page-btn--active' : ''}`}
                          onClick={() => setPage(n)}
                          aria-label={`à¦ªà§‡à¦œ ${toBn(n)}`}
                          aria-current={page === n ? 'page' : undefined}>
                          {toBn(n)}
                        </button>
                      )
                    )}

                    <button className="bsp__page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages} aria-label="à¦ªà¦°à§‡à¦° à¦ªà§‡à¦œ">â€º</button>
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
          à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦“ à¦¸à¦°à§à¦Ÿ
          {hasFilters && <span className="bsp__mobile-badge">{toBn(chips.length)}</span>}
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div className="bsp__drawer-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <div className={`bsp__drawer ${mobileOpen ? 'bsp__drawer--open' : ''}`}
        role="dialog" aria-modal="true" aria-label="à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦“ à¦¸à¦°à§à¦Ÿ">
        <div className="bsp__drawer-header">
          <span className="bsp__drawer-title">à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦° à¦“ à¦¸à¦°à§à¦Ÿ</span>
          <button className="bsp__drawer-close" onClick={() => setMobileOpen(false)}
            aria-label="à¦¡à§à¦°à¦¯à¦¼à¦¾à¦° à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨">
            <X size={20} />
          </button>
        </div>

        <div className="bsp__drawer-sort">
          <span className="bsp__sort-label">à¦¸à¦°à§à¦Ÿ à¦•à¦°à§à¦¨</span>
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
            {toBn(total)} à¦Ÿà¦¿ à¦¬à¦‡ à¦¦à§‡à¦–à§à¦¨
          </button>
        </div>
      </div>

      {/* â”€â”€ Single shared tooltip â€” portalled to <body> â”€â”€ */}
      <HoverTooltip item={hoveredItem} />
    </div>
  )
}

