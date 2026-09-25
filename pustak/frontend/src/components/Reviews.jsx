import { useEffect, useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './Reviews.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'
const formatReviewerName = (name = '') =>
  /^turjo sarker$/i.test(name.trim()) ? 'Turjo Sarkar Prince' : name

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
    // Fetch the highest-rated non-empty reviews from the current bestseller set.
    const loadReviews = async () => {
      try {
        const bsRes  = await fetch(`${BASE}/books/bestsellers?limit=12`)
        const bsJson = await bsRes.json()
        const topBooks = bsJson.data || []

        const reviewGroups = await Promise.all(
          topBooks.map(async (book) => {
            const response = await fetch(`${BASE}/reviews/book/${book.id}`)
            const data = await response.json()
            const bookReviews = data.data || []
            return bookReviews
              .filter(review => review.comment)
              .map(review => ({
                ...review,
                book_name: book.book_name,
                book_id: book.id,
                review_count: bookReviews.length
              }))
          })
        )

        const bestReviews = reviewGroups
          .flat()
          .filter(review => Number(review.review_count || 0) >= 5)
          .sort((a, b) => {
            const ratingDifference = Number(b.rating || 0) - Number(a.rating || 0)
            return ratingDifference || Number(b.review_id || 0) - Number(a.review_id || 0)
          })
          .slice(0, 3)

        setReviews(bestReviews)
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
              aria-label={`${formatReviewerName(r.reviewer_name)} এর রিভিউ`}
            >
              <div className="review-card__header">
                <div className="review-card__avatar" aria-hidden="true">
                  {formatReviewerName(r.reviewer_name || '?')[0].toUpperCase()}
                </div>
                <div className="review-card__info">
                  <strong className="review-card__name">
                    {formatReviewerName(r.reviewer_name || 'পাঠক')}
                  </strong>
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
