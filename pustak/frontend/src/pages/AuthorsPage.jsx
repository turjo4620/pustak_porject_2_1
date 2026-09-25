import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './ListPage.css'
import './AuthorsPage.css'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://putak-porject-2-1.onrender.com/api/authors')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAuthors(json.data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Fetch error:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="list-page">
      <div className="container">

        <div className="list-page__header">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › লেখক
          </p>
          <h1>সকল লেখক</h1>
          <p className="list-page__subtitle">
            {loading ? 'লোড হচ্ছে...' : `${authors.length} জন লেখক`}
          </p>
        </div>

        <div className="authors-grid">
          {loading ? (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
              লেখকদের তথ্য লোড হচ্ছে...
            </p>
          ) : (
            authors.map((author) => (
              <Link
                to={`/author/${author.author_id}`}
                key={author.author_id}
                className="author-card-link"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="author-card">
                  <div className="author-card__avatar">
                    {author.photo_url ? (
                      <img
                        src={author.photo_url}
                        alt={author.name}
                        className="author-avatar-image"
                      />
                    ) : (
                      author.name ? author.name.charAt(0) : '?'
                    )}
                  </div>
                  <div className="author-card__info">
                    <h3 className="author-card__name">{author.name}</h3>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
