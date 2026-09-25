import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './ListPage.css'
import './PublishersPage.css'

const getLogoText = (title) => {
  if (!title) return 'à¦ªà§à¦°'
  const words = title.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2)
  }
  return words.slice(0, 2).map(word => word[0]).join('')
}

export default function PublishersPage() {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('https://putak-porject-2-1.onrender.com/api/publications')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPublications(json.data)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Fetch error:', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <div className="list-page">
      <div className="container">
        <div className="list-page__header">
          <p className="list-page__breadcrumb"><Link to="/">à¦¹à§‹à¦®</Link> â€º à¦ªà§à¦°à¦•à¦¾à¦¶à¦•</p>
          <h1 className="list-page__title">à¦¸à¦•à¦² à¦ªà§à¦°à¦•à¦¾à¦¶à¦¨à§€</h1>
          <p className="list-page__count">
            {loading ? 'à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...' : `${Math.min(publications.length, 20)} à¦Ÿà¦¿ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¨à§€`}
          </p>
        </div>

        {error ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            à¦ªà§à¦°à¦•à¦¾à¦¶à¦• à¦¤à¦¥à§à¦¯ à¦²à§‹à¦¡ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦›à¦¿à¦¨à¦¾à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦ªà¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤
          </p>
        ) : loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>
        ) : (
          <div className="publishers-page-grid">
            {publications.slice(0, 20).map((publication) => (
              <div
                key={publication.publication_id}
                className="pub-page-card"
                onClick={() => navigate(`/publisher/${publication.publication_id}`)}
                role="button"
                tabIndex={0}
                aria-label={publication.title}
              >
                <div className="pub-page-card__logo">
                  {publication.cover_image_url ? (
                    <img
                      src={publication.cover_image_url}
                      alt={publication.title}
                      className="pub-page-card__logo-img"
                    />
                  ) : (
                    getLogoText(publication.title)
                  )}
                </div>
                <strong>{publication.title}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

