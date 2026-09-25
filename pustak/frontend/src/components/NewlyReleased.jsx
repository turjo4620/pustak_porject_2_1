import { useState, useEffect } from 'react'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import './NewlyReleased.css'

export default function NewlyReleased() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://putak-porject-2-1.onrender.com/api/books/new-arrivals?limit=8')
      .then(r => r.json())
      .then(json => setBooks(json.data || []))
      .catch(err => console.error('NewlyReleased fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading || books.length === 0) return null

  return (
    <section className="newly section" aria-label="à¦¨à¦¤à§à¦¨ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¿à¦¤ à¦¬à¦‡">
      <div className="container">
        <SectionHeader
          label="à¦¨à¦¤à§à¦¨ à¦ªà§à¦°à¦•à¦¾à¦¶"
          title="à¦¸à¦¦à§à¦¯ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¿à¦¤"
          subtitle="à¦¸à¦°à§à¦¬à¦¶à§‡à¦· à¦ªà§à¦°à¦•à¦¾à¦¶à¦¿à¦¤ à¦¬à¦‡"
          linkText="à¦¸à¦¬ à¦¦à§‡à¦–à§à¦¨"
          linkHref="/new-arrivals"
        />
        <div className="newly__grid">
          {books.slice(0, 8).map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  )
}

