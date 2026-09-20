import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './AuthorsMarquee.css'

const BASE = 'http://localhost:5000/api'

function AuthorCard({ author }) {
  return (
    <Link
      to={`/author/${author.author_id}`}
      className="am-card"
      aria-label={author.name}
    >
      <div className="am-card__photo-wrap">
        {author.photo_url
          ? <img src={author.photo_url} alt={author.name} className="am-card__photo" />
          : <div className="am-card__fallback">
              {author.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
        }
      </div>
      <span className="am-card__name">{author.name}</span>
      {author.count > 0 && (
        <span className="am-card__count">{author.count} টি বই</span>
      )}
    </Link>
  )
}

export default function AuthorsMarquee() {
  const [authors, setAuthors] = useState([])
  const trackRef = useRef(null)

  useEffect(() => {
    fetch(`${BASE}/authors`)
      .then(r => r.json())
      .then(json => {
        const list = json.data || (Array.isArray(json) ? json : [])
        // Sort by book count descending, take up to 20
        const sorted = [...list]
          .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
          .slice(0, 20)
        setAuthors(sorted)
      })
      .catch(() => {})
  }, [])

  if (!authors.length) return null

  // Duplicate the list so the marquee loops seamlessly
  const doubled = [...authors, ...authors]

  return (
    <section className="authors-marquee section-sm" aria-label="লেখক পরিচিতি">
      <div className="container">
        <SectionHeader
          label="লেখক"
          title="জনপ্রিয় লেখক"
          subtitle="আপনার প্রিয় লেখকের বই খুঁজুন"
          linkText="সব লেখক"
          linkHref="/authors"
        />
      </div>

      {/* Marquee track — overflow hidden wrapper */}
      <div className="am-track-wrap" aria-hidden="false">
        {/* Pause on hover */}
        <div
          className="am-track"
          ref={trackRef}
        >
          {doubled.map((author, i) => (
            <AuthorCard key={`${author.author_id}-${i}`} author={author} />
          ))}
        </div>
      </div>
    </section>
  )
}
