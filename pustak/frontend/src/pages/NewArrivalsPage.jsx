import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BookCard from '../components/BookCard'
import './ListPage.css'

export default function NewArrivalsPage() {
  const [books, setBooks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/books/new-arrivals?limit=60')
      .then(r => r.json())
      .then(json => setBooks(json.data || []))
      .catch(() => setError('বই লোড করা যায়নি'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="list-page">
      <div className="container">
        <div className="list-page__header">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › নতুন বই
          </p>
          <h1 className="list-page__title">নতুন প্রকাশিত বই</h1>
          <p className="list-page__count">
            {loading
              ? 'লোড হচ্ছে...'
              : `${books.length}টি সর্বশেষ প্রকাশিত বই`}
          </p>
        </div>

        {error && <p style={{ textAlign: 'center', color: '#dc2626' }}>{error}</p>}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
        ) : (
          <div className="list-page__grid">
            {books.map(b => <BookCard key={b.id} book={b} />)}
          </div>
        )}
      </div>
    </div>
  )
}
