import { useEffect, useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './Reviews.css'

const BASE = 'http://localhost:5000/api'

function StarRow({ rating }) {
  return (
    <div className="review-card__stars" aria-label={`রেটিং: ${rating} এর মধ্যে ৫`}>
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n} size={13}
          className={n <= rating ? 'star--filled' : 'star--empty'}
          fill={n <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    // Fetch the 3 most recent non-empty reviews across all books
    // We use the admin endpoint if available, else fall back to a direct reviews approach.
    // Since there's no public "all reviews" endpoint we fetch bestsellers first,
    // then collect reviews for the top book.
    const loadReviews = async () => {
      try {
        // Get bestseller book IDs
        const bsRes  = await fetch(`${BASE}/books/bestsellers?limit=6`)
        const bsJson = await bsRes.json()
        const topBooks = (bsJson.data || []).slice(0, 6)

        // Collect reviews from those books in parallel, stop when we have 3
        const collected = []
        for (const book of topBooks) {
          if (collected.length >= 3) break
          const rRes  = await fetch(`${BASE}/reviews/book/${book.id}`)
          const rJson = await rRes.json()
          const rows  = (rJson.data || []).filter(r => r.comment)
          rows.slice(0, 3 - collected.length).forEach(r =>
            collected.push({ ...r, book_name: book.book_name, book_id: book.id })
          )
        }
        setReviews(collected)
      } catch {
        setReviews([])
      }
    }
    loadReviews()
  }, [])

  if (!reviews.length) return null

  return (
    <section className="reviews section-sm" aria-label="পাঠক রিভিউ">
      <div className="container">
        <SectionHeader
          label="পাঠক মতামত"
          title="পাঠকরা কী বলছেন"
          align="center"
        />
        <div className="reviews__grid">
          {reviews.map((r) => (
            <article
              key={r.review_id}
              className="review-card"
              aria-label={`${r.reviewer_name} এর রিভিউ`}
            >
              <div className="review-card__header">
                <div className="review-card__avatar" aria-hidden="true">
                  {(r.reviewer_name || '?')[0].toUpperCase()}
                </div>
                <div className="review-card__info">
                  <strong className="review-card__name">{r.reviewer_name || 'পাঠক'}</strong>
                </div>
                <StarRow rating={r.rating} />
              </div>

              <p className="review-card__text">"{r.comment}"</p>

              <div className="review-card__footer">
                <Link
                  to={`/book/${r.book_id}`}
                  className="review-card__book"
                >
                  <MessageSquare size={11} />
                  {r.book_name}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
