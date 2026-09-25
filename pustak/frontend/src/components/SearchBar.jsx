import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, X } from 'lucide-react'
import './SearchBar.css'

const trending = ['à¦¹à¦¿à¦®à§', 'à¦¹à§à¦®à¦¾à¦¯à¦¼à§‚à¦¨ à¦†à¦¹à¦®à§‡à¦¦', 'à¦°à¦¬à§€à¦¨à§à¦¦à§à¦°à¦¨à¦¾à¦¥', 'à¦®à§à¦•à§à¦¤à¦¿à¦¯à§à¦¦à§à¦§', 'à¦¨à¦¤à§à¦¨ à¦¬à¦‡', 'à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨']

const BASE = 'https://putak-porject-2-1.onrender.com/api'

export default function SearchBar() {
  const navigate   = useNavigate()
  const [query,    setQuery]    = useState('')
  const [focused,  setFocused]  = useState(false)
  const [visible,  setVisible]  = useState(false)
  const [results,  setResults]  = useState([])   // live suggestions from API
  const [loading,  setLoading]  = useState(false)
  const inputRef   = useRef(null)
  const wrapRef    = useRef(null)
  const debounce   = useRef(null)
  const requestSeq = useRef(0)

  // Intersection observer for entry animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (wrapRef.current) observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [])

  // Debounced live search
  useEffect(() => {
    clearTimeout(debounce.current)
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const seq = ++requestSeq.current
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${BASE}/books/search?q=${encodeURIComponent(term)}&limit=6`)
        const json = await res.json()
        if (seq === requestSeq.current) setResults(json.data || [])
      } catch {
        if (seq === requestSeq.current) setResults([])
      } finally {
        if (seq === requestSeq.current) setLoading(false)
      }
    }, 280)
    return () => clearTimeout(debounce.current)
  }, [query])

  const goSearch = useCallback((q) => {
    const term = (q ?? query).trim()
    if (!term) return
    setFocused(false)
    setQuery(term)
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }, [query, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    goSearch()
  }

  const handleChip = (t) => {
    setQuery(t)
    goSearch(t)
  }

  const showDropdown = focused && (query.length >= 2 || query.length === 0)

  return (
    <section
      className={`search-section section-sm ${visible ? 'search-section--visible' : ''}`}
      ref={wrapRef}
      aria-label="à¦¬à¦‡ à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨"
    >
      <div className="container">
        <div className="search-section__inner">
          <p className="search-section__label">à¦†à¦ªà¦¨à¦¾à¦° à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨</p>

          <form
            className={`search-wrap ${focused ? 'search-wrap--focused' : ''}`}
            onSubmit={handleSubmit}
            role="search"
          >
            <div className="search-input-row">
              <Search size={22} className="search-input-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                className="search-input"
                placeholder="à¦¬à¦‡, à¦²à§‡à¦–à¦•, à¦ªà§à¦°à¦•à¦¾à¦¶à¦• à¦¬à¦¾ à¦¬à¦¿à¦­à¦¾à¦— à¦²à¦¿à¦–à§à¦¨..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                aria-label="à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨"
                aria-expanded={showDropdown}
                aria-haspopup="listbox"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                  aria-label="à¦®à§à¦›à§à¦¨"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="search-btn" aria-label="à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨ à¦•à¦°à§à¦¨">
                à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨
              </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="search-dropdown" role="listbox" aria-label="à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨ à¦«à¦²à¦¾à¦«à¦²">

                {/* Trending (empty query) */}
                {query.length === 0 && (
                  <div className="search-dropdown__section">
                    <div className="search-dropdown__header">
                      <TrendingUp size={14} /> à¦Ÿà§à¦°à§‡à¦¨à§à¦¡à¦¿à¦‚ à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨
                    </div>
                    <div className="search-dropdown__chips">
                      {trending.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="search-chip"
                          onClick={() => handleChip(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live results */}
                {query.length >= 2 && (
                  <div className="search-dropdown__section">
                    {loading && (
                      <p className="search-dropdown__loading">à¦–à§à¦à¦œà¦›à¦¿...</p>
                    )}
                    {!loading && results.length === 0 && (
                      <p className="search-dropdown__empty">à¦•à§‹à¦¨à§‹ à¦«à¦²à¦¾à¦«à¦² à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤</p>
                    )}
                    {!loading && results.map((book) => (
                      <div
                        key={book.id}
                        className="search-suggestion"
                        role="option"
                        tabIndex={0}
                        onClick={() => navigate(`/book/${book.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/book/${book.id}`)}
                      >
                        {book.cover_image_url
                          ? <img src={book.cover_image_url} alt={book.book_name} className="search-suggestion__cover" />
                          : <div className="search-suggestion__cover search-suggestion__cover--fallback">ðŸ“–</div>
                        }
                        <div className="search-suggestion__info">
                          <strong>{book.book_name}</strong>
                          <span>{book.author || book.authors?.[0]?.name || ''}</span>
                        </div>
                        <span className="search-suggestion__type">à¦¬à¦‡</span>
                      </div>
                    ))}
                  </div>
                )}

                {query.length >= 2 && (
                  <div className="search-dropdown__footer">
                    <button
                      type="submit"
                      className="search-dropdown__all"
                    >
                      "{query}" â€” à¦¸à¦¬ à¦«à¦²à¦¾à¦«à¦² à¦¦à§‡à¦–à§à¦¨ â†’
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Trending chips below bar */}
          <div className="search-section__trending" aria-label="à¦Ÿà§à¦°à§‡à¦¨à§à¦¡à¦¿à¦‚">
            <span className="search-section__trending-label">à¦Ÿà§à¦°à§‡à¦¨à§à¦¡à¦¿à¦‚:</span>
            {trending.slice(0, 5).map((t) => (
              <button
                key={t}
                type="button"
                className="search-section__chip"
                onClick={() => handleChip(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

