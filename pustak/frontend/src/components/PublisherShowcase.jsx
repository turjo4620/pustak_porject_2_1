import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './PublisherShowcase.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

function initials(title = '') {
  return title.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

export default function PublisherShowcase() {
  const [publications, setPublications] = useState([])

  useEffect(() => {
    fetch(`${BASE}/publications`)
      .then(r => r.json())
      .then(json => setPublications(json.data || (Array.isArray(json) ? json : [])))
      .catch(() => {})
  }, [])

  if (!publications.length) return null

  return (
    <section className="publishers section-sm" aria-label="à¦ªà§à¦°à¦•à¦¾à¦¶à¦• à¦ªà¦°à¦¿à¦šà¦¿à¦¤à¦¿">
      <div className="container">
        <SectionHeader
          title="à¦¬à¦¿à¦¶à§à¦¬à¦¸à§à¦¤ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¨à§€"
          align="center"
        />
        <div className="publishers__grid">
          {publications.map((pub) => (
            <Link
              key={pub.publication_id}
              to={`/publisher/${pub.publication_id}`}
              className="publisher-card"
              aria-label={pub.title}
            >
              <div className="publisher-card__logo">
                {pub.cover_image_url
                  ? <img
                      src={pub.cover_image_url}
                      alt={pub.title}
                      className="publisher-card__logo-img"
                    />
                  : <span className="publisher-card__logo-initials">
                      {initials(pub.title)}
                    </span>
                }
              </div>
              <div className="publisher-card__info">
                <strong>{pub.title}</strong>
                {pub.bio && (
                  <span className="publisher-card__bio">
                    {pub.bio.slice(0, 60)}{pub.bio.length > 60 ? 'â€¦' : ''}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

