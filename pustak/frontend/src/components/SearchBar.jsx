import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, X } from 'lucide-react'
import './SearchBar.css'

const trending = ['হিমু', 'হুমায়ূন আহমেদ', 'রবীন্দ্রনাথ', 'মুক্তিযুদ্ধ', 'নতুন বই', 'বিজ্ঞান']

const BASE = 'http://localhost:5000/api'

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
    if (query.trim().length < 2) { setResults([]); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${BASE}/books/search?q=${encodeURIComponent(query.trim())}&limit=6`)
        const json = await res.json()
        setResults(json.data || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
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
      aria-label="বই অনুসন্ধান"
    >
      <div className="container">
        <div className="search-section__inner">
          <p className="search-section__label">আপনার পছন্দের বই খুঁজুন</p>

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
                placeholder="বই, লেখক, প্রকাশক বা বিভাগ লিখুন..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                aria-label="বই খুঁজুন"
                aria-expanded={showDropdown}
                aria-haspopup="listbox"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                  aria-label="মুছুন"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="search-btn" aria-label="অনুসন্ধান করুন">
                অনুসন্ধান
              </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="search-dropdown" role="listbox" aria-label="অনুসন্ধান ফলাফল">

                {/* Trending (empty query) */}
                {query.length === 0 && (
                  <div className="search-dropdown__section">
                    <div className="search-dropdown__header">
                      <TrendingUp size={14} /> ট্রেন্ডিং অনুসন্ধান
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
                      <p className="search-dropdown__loading">খুঁজছি...</p>
                    )}
                    {!loading && results.length === 0 && (
                      <p className="search-dropdown__empty">কোনো ফলাফল পাওয়া যায়নি।</p>
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
                          : <div className="search-suggestion__cover search-suggestion__cover--fallback">📖</div>
                        }
                        <div className="search-suggestion__info">
                          <strong>{book.book_name}</strong>
                          <span>{book.author || book.authors?.[0]?.name || ''}</span>
                        </div>
                        <span className="search-suggestion__type">বই</span>
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
                      "{query}" — সব ফলাফল দেখুন →
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Trending chips below bar */}
          <div className="search-section__trending" aria-label="ট্রেন্ডিং">
            <span className="search-section__trending-label">ট্রেন্ডিং:</span>
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
