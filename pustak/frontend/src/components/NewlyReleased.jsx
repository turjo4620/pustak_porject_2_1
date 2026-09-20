import { useState, useEffect } from 'react'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import './NewlyReleased.css'

export default function NewlyReleased() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5000/api/books/new-arrivals?limit=8')
      .then(r => r.json())
      .then(json => setBooks(json.data || []))
      .catch(err => console.error('NewlyReleased fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading || books.length === 0) return null

  return (
    <section className="newly section" aria-label="নতুন প্রকাশিত বই">
      <div className="container">
        <SectionHeader
          label="নতুন প্রকাশ"
          title="সদ্য প্রকাশিত"
          subtitle="সর্বশেষ প্রকাশিত বই"
          linkText="সব নতুন বই"
          linkTo="/new-arrivals"
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
