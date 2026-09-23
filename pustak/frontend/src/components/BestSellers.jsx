import { useState, useEffect } from 'react'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import './BestSellers.css'

export default function BestSellers() {
  const [bestSellers, setBestSellers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/books/bestsellers?limit=20')
        const data = await response.json()
        setBestSellers(data.data || [])
      } catch (error) {
        console.error('Error fetching bestsellers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBestsellers()
  }, [])

  if (loading) {
    return (
      <section className="bestsellers section" id="books" aria-label="বেস্টসেলার বই">
        <div className="container">
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
        </div>
      </section>
    )
  }

  if (bestSellers.length === 0) {
    return null
  }

  return (
    <section className="bestsellers section" id="books" aria-label="বেস্টসেলার বই">
        <div className="container">
          <SectionHeader
            label="বেস্টসেলার"
            title="আজকের নির্বাচিত বই"
            subtitle="পাঠকদের পছন্দের আজকের সেরা বইগুলো"
            linkText="সব দেখুন"
            linkHref="/bestsellers"
          />

          <div className="bestsellers__grid" role="list" aria-label="নির্বাচিত বইয়ের তালিকা">
            {bestSellers.slice(0, 5).map((book) => (
              <div key={book.id} className="bestsellers__item" role="listitem">
                <BookCard book={book} />
              </div>
            ))}
          </div>
        </div>
    </section>
  )
}
