import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { collections } from '../data/books'
import SectionHeader from './SectionHeader'
import './FeaturedCollections.css'

export default function FeaturedCollections() {
  const navigate = useNavigate()
  return (
    <section className="featured section" id="collections" aria-label="বিশেষ সংগ্রহ">
      <div className="container">
        <SectionHeader
          label="কিউরেটেড সংগ্রহ"
          title="প্রতিটি মুডের জন্য"
          subtitle="পাঠকের রুচি ও আগ্রহ অনুযায়ী সাজানো বিশেষ সংগ্রহ"
          linkText="সব দেখুন"
          linkHref="/bestsellers"
        />

        <div className="featured__grid">
          {collections.map((col, i) => (
            <CollectionCard key={col.id} collection={col} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CollectionCard({ collection, index }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <article
      className={`col-card ${visible ? 'col-card--visible' : ''}`}
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      aria-label={`সংগ্রহ: ${collection.title}`}
    >
      <div className="col-card__bg" style={{ background: collection.coverGradient }} aria-hidden="true">
        {/* Stacked mini book covers */}
        <div className="col-card__books" aria-hidden="true">
          {collection.books.slice(0, 3).map((book, bi) => (
            <div
              key={book.id}
              className="col-card__mini-book"
              style={{
                left: `${30 + bi * 28}px`,
                bottom: `${8 + bi * 6}px`,
                transform: `rotate(${[-6, 0, 8][bi]}deg)`,
                zIndex: bi,
              }}
            >
              <img src={book.cover} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        {/* Decorative texture */}
        <div className="col-card__texture" aria-hidden="true" />
      </div>

      <div className="col-card__info">
        <div>
          <h3 className="col-card__title">{collection.title}</h3>
          <p className="col-card__subtitle">{collection.subtitle}</p>
        </div>
        <div className="col-card__meta">
          <span className="col-card__count">{collection.count} টি বই</span>
          <button
            className="col-card__link"
            aria-label={`${collection.title} সংগ্রহ দেখুন`}
            onClick={() => navigate('/bestsellers')}
          >
            দেখুন <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
