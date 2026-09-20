import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import './Recommendations.css'

const CATEGORIES = [
  { label: 'সব', id: null },
  { label: 'উপন্যাস', id: null, name: 'উপন্যাস' },
  { label: 'কবিতা',   id: null, name: 'কবিতা'   },
  { label: 'বিজ্ঞান', id: null, name: 'বিজ্ঞান' },
  { label: 'ইতিহাস',  id: null, name: 'ইতিহাস'  },
  { label: 'ইসলামিক', id: null, name: 'ইসলামিক' },
]

const BASE = 'http://localhost:5000/api'

export default function Recommendations() {
  const [active, setActive]   = useState(0)   // index into CATEGORIES
  const [books, setBooks]     = useState([])
  const [cats, setCats]       = useState([])  // fetched from DB
  const [loading, setLoading] = useState(true)

  // Fetch categories once so we can map labels → IDs
  useEffect(() => {
    fetch(`${BASE}/categories`)
      .then(r => r.json())
      .then(json => setCats(json.data || (Array.isArray(json) ? json : [])))
      .catch(() => {})
  }, [])

  // Fetch books when active tab changes
  useEffect(() => {
    setLoading(true)
    const tab = CATEGORIES[active]

    let url
    if (active === 0 || !tab.name) {
      // "সব" tab — show bestsellers
      url = `${BASE}/books/bestsellers?limit=8`
    } else {
      // Find matching category from DB
      const match = cats.find(c =>
        c.category_name?.toLowerCase().includes(tab.name.toLowerCase()) ||
        tab.name.toLowerCase().includes(c.category_name?.toLowerCase())
      )
      if (match) {
        url = `${BASE}/books/category/${match.category_id}?limit=8`
      } else {
        // Fallback to bestsellers if category not found
        url = `${BASE}/books/bestsellers?limit=8`
      }
    }

    fetch(url)
      .then(r => r.json())
      .then(json => setBooks(json.data || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [active, cats])

  if (!loading && books.length === 0) return null

  return (
    <section className="reco section" aria-label="বিভাগ অনুযায়ী বই">
      <div className="container">
        <SectionHeader
          label="বিভাগ অনুযায়ী"
          title="পছন্দের বিভাগ থেকে বেছে নিন"
          subtitle="বিভাগ বেছে নিয়ে আপনার পছন্দের বই খুঁজুন"
          linkText="সব বিভাগ"
          linkTo="/categories"
        />

        {/* Filter tabs */}
        <div className="reco__tabs" role="tablist" aria-label="বিভাগ ফিল্টার">
          {CATEGORIES.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={active === i}
              className={`reco__tab ${active === i ? 'reco__tab--active' : ''}`}
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="reco__grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="reco__skeleton" />
            ))}
          </div>
        ) : (
          <div className="reco__grid reco__grid--visible">
            {books.slice(0, 8).map((book) => (
              <div key={book.id} className="reco__item">
                <BookCard book={book} />
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/categories" className="reco__all-link">
            সব বিভাগ দেখুন →
          </Link>
        </div>
      </div>
    </section>
  )
}
