import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './RankedBestsellers.css'

const MEDALS = ['🥇', '🥈', '🥉']
const toBn = (value) => String(value).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit])

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
    <section className="ranked-bestsellers section-sm" aria-label="সেরা বিক্রিত বইয়ের র‍্যাংকিং">
      <div className="container">
        <SectionHeader
          label="র‍্যাংকিং"
          title="সেরা বিক্রিত তালিকা"
          subtitle="সবচেয়ে বেশি কেনা বইয়ের বর্তমান তালিকা"
          linkText="সব দেখুন"
          linkHref="/bestsellers"
        />

        <div className="ranked-bestsellers__list" role="list">
          {books.map((book, index) => {
            const title = book.book_name || book.title || 'শিরোনাম নেই'
            return (
              <Link
                to={`/book/${book.id}`}
                className={`ranked-bestsellers__item rank-card--${index + 1}`}
                key={book.id}
                role="listitem"
                aria-label={`${index + 1} নম্বর: ${title}`}
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
                  <span className="ranked-bestsellers__author">{book.author || 'অজ্ঞাত'}</span>
                  <span className="ranked-bestsellers__price">
                    ৳{toBn(Number(book.discount_price || book.price || 0))}
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
