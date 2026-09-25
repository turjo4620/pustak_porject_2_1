import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './AuthorsMarquee.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

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
        const sorted = [...list]
          .filter(author => !/^(Stephen King|স্টিফেন কিং)$/i.test(author.name?.trim()))
          .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
          .slice(0, 20)
        setAuthors(sorted)
      })
      .catch(() => {})

  }, [])

  if (!authors.length) return null

  const doubled = [...authors, ...authors]

  return (
    <section className="authors-marquee section-sm" aria-label="জনপ্রিয় লেখক ও শীর্ষ বিক্রিত বই">
      <div className="container">
        <SectionHeader
          label="লেখক"
          title="জনপ্রিয় লেখক"
          subtitle="আপনার প্রিয় লেখকের বই খুঁজুন"
          linkText="সব দেখুন"
          linkHref="/authors"
        />
      </div>

      <div className="am-track-wrap">
        <div className="am-track" ref={trackRef}>
          {doubled.map((author, i) => (
            <AuthorCard key={`${author.author_id}-${i}`} author={author} />
          ))}
        </div>
      </div>
    </section>
  )
}
