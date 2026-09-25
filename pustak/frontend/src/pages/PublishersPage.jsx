import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './ListPage.css'
import './PublishersPage.css'

const getLogoText = (title) => {
  if (!title) return 'প্র'
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
          <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › প্রকাশক</p>
          <h1 className="list-page__title">সকল প্রকাশনী</h1>
          <p className="list-page__count">
            {loading ? 'লোড হচ্ছে...' : `${Math.min(publications.length, 20)} টি প্রকাশনী`}
          </p>
        </div>

        {error ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            প্রকাশক তথ্য লোড করতে পারছিনা। অনুগ্রহ করে পরে আবার চেষ্টা করুন।
          </p>
        ) : loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
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
