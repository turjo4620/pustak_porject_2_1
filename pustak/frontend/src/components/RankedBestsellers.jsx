import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './RankedBestsellers.css'

const MEDALS = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰']
const toBn = (value) => String(value).replace(/[0-9]/g, (digit) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[digit])

export default function RankedBestsellers() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://putak-porject-2-1.onrender.com/api/books/bestsellers?limit=5')
      .then(response => response.json())
      .then(data => setBooks(data.data || []))
      .catch(error => console.error('Error fetching ranked bestsellers:', error))
      .finally(() => setLoading(false))
  }, [])

  if (loading || books.length === 0) return null

  return (
    <section className="ranked-bestsellers section-sm" aria-label="à¦¸à§‡à¦°à¦¾ à¦¬à¦¿à¦•à§à¦°à¦¿à¦¤ à¦¬à¦‡à¦¯à¦¼à§‡à¦° à¦°â€à§à¦¯à¦¾à¦‚à¦•à¦¿à¦‚">
      <div className="container">
        <SectionHeader
          label="à¦°â€à§à¦¯à¦¾à¦‚à¦•à¦¿à¦‚"
          title="à¦¸à§‡à¦°à¦¾ à¦¬à¦¿à¦•à§à¦°à¦¿à¦¤ à¦¤à¦¾à¦²à¦¿à¦•à¦¾"
          subtitle="à¦¸à¦¬à¦šà§‡à¦¯à¦¼à§‡ à¦¬à§‡à¦¶à¦¿ à¦•à§‡à¦¨à¦¾ à¦¬à¦‡à¦¯à¦¼à§‡à¦° à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦¤à¦¾à¦²à¦¿à¦•à¦¾"
          linkText="à¦¸à¦¬ à¦¦à§‡à¦–à§à¦¨"
          linkHref="/bestsellers"
        />

        <div className="ranked-bestsellers__list" role="list">
          {books.map((book, index) => {
            const title = book.book_name || book.title || 'à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® à¦¨à§‡à¦‡'
            return (
              <Link
                to={`/book/${book.id}`}
                className={`ranked-bestsellers__item rank-card--${index + 1}`}
                key={book.id}
                role="listitem"
                aria-label={`${index + 1} à¦¨à¦®à§à¦¬à¦°: ${title}`}
              >
                <span className="ranked-bestsellers__rank">
                  {index < 3 ? MEDALS[index] : `#${toBn(index + 1)}`}
                </span>
                <img
                  className="ranked-bestsellers__cover"
                  src={book.cover_image_url || book.cover}
                  alt=""
                  loading="lazy"
                />
                <span className="ranked-bestsellers__info">
                  <strong className="ranked-bestsellers__title">{title}</strong>
                  <span className="ranked-bestsellers__author">{book.author || 'à¦…à¦œà§à¦žà¦¾à¦¤'}</span>
                  <span className="ranked-bestsellers__price">
                    à§³{toBn(Number(book.discount_price || book.price || 0))}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

