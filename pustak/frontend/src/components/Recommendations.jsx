import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import './Recommendations.css'

const CATEGORIES = [
  { label: 'à¦¸à¦¬', id: null },
  { label: 'à¦‰à¦ªà¦¨à§à¦¯à¦¾à¦¸', id: null, name: 'à¦‰à¦ªà¦¨à§à¦¯à¦¾à¦¸' },
  { label: 'à¦•à¦¬à¦¿à¦¤à¦¾',   id: null, name: 'à¦•à¦¬à¦¿à¦¤à¦¾'   },
  { label: 'à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨', id: null, name: 'à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨' },
  { label: 'à¦‡à¦¤à¦¿à¦¹à¦¾à¦¸',  id: null, name: 'à¦‡à¦¤à¦¿à¦¹à¦¾à¦¸'  },
  { label: 'à¦‡à¦¸à¦²à¦¾à¦®à¦¿à¦•', id: null, name: 'à¦‡à¦¸à¦²à¦¾à¦®à¦¿à¦•' },
]

const BASE = 'https://putak-porject-2-1.onrender.com/api'

export default function Recommendations() {
  const [active, setActive]   = useState(0)   // index into CATEGORIES
  const [books, setBooks]     = useState([])
  const [cats, setCats]       = useState([])  // fetched from DB
  const [loading, setLoading] = useState(true)

  // Fetch categories once so we can map labels â†’ IDs
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
      // "à¦¸à¦¬" tab â€” show bestsellers
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
    <section className="reco section" aria-label="à¦¬à¦¿à¦­à¦¾à¦— à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ à¦¬à¦‡">
      <div className="container">
        <SectionHeader
          label="à¦¬à¦¿à¦­à¦¾à¦— à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€"
          title="à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¬à¦¿à¦­à¦¾à¦— à¦¥à§‡à¦•à§‡ à¦¬à§‡à¦›à§‡ à¦¨à¦¿à¦¨"
          subtitle="à¦¬à¦¿à¦­à¦¾à¦— à¦¬à§‡à¦›à§‡ à¦¨à¦¿à¦¯à¦¼à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨"
          linkText="à¦¸à¦¬ à¦¦à§‡à¦–à§à¦¨"
          linkHref="/categories"
        />

        {/* Filter tabs */}
        <div className="reco__tabs" role="tablist" aria-label="à¦¬à¦¿à¦­à¦¾à¦— à¦«à¦¿à¦²à§à¦Ÿà¦¾à¦°">
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
            à¦¸à¦¬ à¦¬à¦¿à¦­à¦¾à¦— à¦¦à§‡à¦–à§à¦¨ â†’
          </Link>
        </div>
      </div>
    </section>
  )
}

