import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './AuthorSpotlight.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

export default function AuthorSpotlight() {
  const [visible, setVisible] = useState(false)
  const [authors, setAuthors] = useState([])
  const [authorIndex, setAuthorIndex] = useState(0)
  const [books,   setBooks]   = useState([])
  const ref = useRef(null)

  const author = authors[authorIndex] || null

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetch(`${BASE}/authors`)
      .then(r => r.json())
      .then(json => {
        const list = json.data || (Array.isArray(json) ? json : [])
        setAuthors([...list]
          .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
          .slice(0, 12))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!author) return

    setBooks([])
    fetch(`${BASE}/books/author/${author.author_id}?limit=4`)
      .then(r => r.json())
      .then(json => setBooks((json.data || []).slice(0, 4)))
      .catch(() => setBooks([]))
  }, [author])

  if (!author) return null

  return (
    <section
      className={`author section ${visible ? 'author--visible' : ''}`}
      ref={ref}
      aria-label="লেখক স্পটলাইট"
    >
      <div className="container">
        <div className="author__inner" key={author.author_id}>

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
              "বই হলো আলোর বাতিঘর"
            </div>
          </div>

          {/* Info */}
          <div className="author__info">
            <div className="author__topline">
              <span className="author__label">লেখক পরিচিতি</span>
              <div className="author__controls" aria-label="লেখক পরিবর্তন করুন">
                <button
                  type="button"
                  className="author__control"
                  onClick={() => setAuthorIndex(index => Math.max(0, index - 1))}
                  disabled={authorIndex === 0}
                  aria-label="আগের লেখক"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="author__counter">{authorIndex + 1}/{authors.length}</span>
                <button
                  type="button"
                  className="author__control"
                  onClick={() => setAuthorIndex(index => Math.min(authors.length - 1, index + 1))}
                  disabled={authorIndex >= authors.length - 1}
                  aria-label="পরের লেখক"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <h2 className="author__name">{author.name}</h2>
            {author.bio && (
              <p className="author__bio">
                {author.bio.slice(0, 240)}{author.bio.length > 240 ? '…' : ''}
              </p>
            )}

            <div className="author__stat-row" aria-label="লেখকের পরিসংখ্যান">
              <div className="author__stat">
                <strong>{author.count || '—'}</strong>
                <span>রচনা</span>
              </div>
            </div>

            {/* Popular books */}
            {books.length > 0 && (
              <div className="author__books" aria-label="জনপ্রিয় বই">
                <p className="author__books-label">জনপ্রিয় বই</p>
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
              সকল বই দেখুন
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
