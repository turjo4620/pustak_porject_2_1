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
        const response = await fetch('https://putak-porject-2-1.onrender.com/api/books/bestsellers?limit=20')
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
      <section className="bestsellers section" id="books" aria-label="à¦¬à§‡à¦¸à§à¦Ÿà¦¸à§‡à¦²à¦¾à¦° à¦¬à¦‡">
        <div className="container">
          <p style={{ textAlign: 'center', padding: '2rem' }}>à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>
        </div>
      </section>
    )
  }

  if (bestSellers.length === 0) {
    return null
  }

  return (
    <section className="bestsellers section" id="books" aria-label="à¦¬à§‡à¦¸à§à¦Ÿà¦¸à§‡à¦²à¦¾à¦° à¦¬à¦‡">
        <div className="container">
          <SectionHeader
            label="à¦¬à§‡à¦¸à§à¦Ÿà¦¸à§‡à¦²à¦¾à¦°"
            title="à¦†à¦œà¦•à§‡à¦° à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¿à¦¤ à¦¬à¦‡"
            subtitle="à¦ªà¦¾à¦ à¦•à¦¦à§‡à¦° à¦ªà¦›à¦¨à§à¦¦à§‡à¦° à¦†à¦œà¦•à§‡à¦° à¦¸à§‡à¦°à¦¾ à¦¬à¦‡à¦—à§à¦²à§‹"
            linkText="à¦¸à¦¬ à¦¦à§‡à¦–à§à¦¨"
            linkHref="/bestsellers"
          />

          <div className="bestsellers__grid" role="list" aria-label="à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¿à¦¤ à¦¬à¦‡à¦¯à¦¼à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾">
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

