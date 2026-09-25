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
        <span className="am-card__count">{author.count} à¦Ÿà¦¿ à¦¬à¦‡</span>
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
          .filter(author => !/^(Stephen King|à¦¸à§à¦Ÿà¦¿à¦«à§‡à¦¨ à¦•à¦¿à¦‚)$/i.test(author.name?.trim()))
          .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
          .slice(0, 20)
        setAuthors(sorted)
      })
      .catch(() => {})

  }, [])

  if (!authors.length) return null

  const doubled = [...authors, ...authors]

  return (
    <section className="authors-marquee section-sm" aria-label="à¦œà¦¨à¦ªà§à¦°à¦¿à¦¯à¦¼ à¦²à§‡à¦–à¦• à¦“ à¦¶à§€à¦°à§à¦· à¦¬à¦¿à¦•à§à¦°à¦¿à¦¤ à¦¬à¦‡">
      <div className="container">
        <SectionHeader
          label="à¦²à§‡à¦–à¦•"
          title="à¦œà¦¨à¦ªà§à¦°à¦¿à¦¯à¦¼ à¦²à§‡à¦–à¦•"
          subtitle="à¦†à¦ªà¦¨à¦¾à¦° à¦ªà§à¦°à¦¿à¦¯à¦¼ à¦²à§‡à¦–à¦•à§‡à¦° à¦¬à¦‡ à¦–à§à¦à¦œà§à¦¨"
          linkText="à¦¸à¦¬ à¦¦à§‡à¦–à§à¦¨"
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

