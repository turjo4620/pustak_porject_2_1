import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './AuthorSpotlight.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

export default function AuthorSpotlight() {
  const [visible, setVisible] = useState(false)
  const [author,  setAuthor]  = useState(null)
  const [books,   setBooks]   = useState([])
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Fetch the first author (highest author_id = most recently added, or just id=1)
  useEffect(() => {
    fetch(`${BASE}/authors`)
      .then(r => r.json())
      .then(json => {
        const list = json.data || (Array.isArray(json) ? json : [])
        // Pick the author with the most books
        const top = list.sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0]
        if (top) setAuthor(top)
        return top
      })
      .then(top => {
        if (!top) return
        return fetch(`${BASE}/books/author/${top.author_id}?limit=4`)
          .then(r => r.json())
          .then(json => setBooks((json.data || []).slice(0, 4)))
          .catch(() => {})
      })
      .catch(() => {})
  }, [])

  if (!author) return null

  return (
    <section
      className={`author section ${visible ? 'author--visible' : ''}`}
      ref={ref}
      aria-label="à¦²à§‡à¦–à¦• à¦¸à§à¦ªà¦Ÿà¦²à¦¾à¦‡à¦Ÿ"
    >
      <div className="container">
        <div className="author__inner">

          {/* Portrait */}
          <div className="author__portrait-wrap" aria-hidden="true">
            <div className="author__portrait-bg" />
            <div className="author__portrait">
              {author.photo_url
                ? <img src={author.photo_url} alt={author.name} className="author__photo" />
                : <div className="author__avatar">{author.name?.charAt(0) || '?'}</div>
              }
            </div>
            <div className="author__quote-bubble" aria-hidden="true">
              "à¦¬à¦‡ à¦¹à¦²à§‹ à¦†à¦²à§‹à¦° à¦¬à¦¾à¦¤à¦¿à¦˜à¦°"
            </div>
          </div>

          {/* Info */}
          <div className="author__info">
            <span className="author__label">à¦²à§‡à¦–à¦• à¦ªà¦°à¦¿à¦šà¦¿à¦¤à¦¿</span>
            <h2 className="author__name">{author.name}</h2>
            {author.bio && (
              <p className="author__bio">
                {author.bio.slice(0, 240)}{author.bio.length > 240 ? 'â€¦' : ''}
              </p>
            )}

            <div className="author__stat-row" aria-label="à¦²à§‡à¦–à¦•à§‡à¦° à¦ªà¦°à¦¿à¦¸à¦‚à¦–à§à¦¯à¦¾à¦¨">
              <div className="author__stat">
                <strong>{author.count || 'â€”'}</strong>
                <span>à¦°à¦šà¦¨à¦¾</span>
              </div>
            </div>

            {/* Popular books */}
            {books.length > 0 && (
              <div className="author__books" aria-label="à¦œà¦¨à¦ªà§à¦°à¦¿à¦¯à¦¼ à¦¬à¦‡">
                <p className="author__books-label">à¦œà¦¨à¦ªà§à¦°à¦¿à¦¯à¦¼ à¦¬à¦‡</p>
                <div className="author__books-grid">
                  {books.map((b) => (
                    <Link
                      key={b.id}
                      to={`/book/${b.id}`}
                      className="author__mini-book"
                      title={b.book_name}
                    >
                      <img
                        src={b.cover_image_url}
                        alt={b.book_name}
                        loading="lazy"
                      />
                      <span>{b.book_name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              to={`/author/${author.author_id}`}
              className="author__btn"
            >
              à¦¸à¦•à¦² à¦¬à¦‡ à¦¦à§‡à¦–à§à¦¨
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

