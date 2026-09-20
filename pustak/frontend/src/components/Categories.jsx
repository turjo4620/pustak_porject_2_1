import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from './SectionHeader'
import './Categories.css'

// Emoji/icon map keyed by partial category name match (fallback to 📚)
const ICON_MAP = [
  { match: /উপন্যাস/,          icon: '📖' },
  { match: /গল্প/,              icon: '📝' },
  { match: /কবিত/,             icon: '🎭' },
  { match: /বিজ্ঞান|প্রযুক্তি/, icon: '🔬' },
  { match: /ইতিহাস/,            icon: '🏛️' },
  { match: /মুক্তিযুদ্ধ/,       icon: '🇧🇩' },
  { match: /শিশু|কিশোর/,        icon: '🧒' },
  { match: /ধর্ম|ইসলাম/,        icon: '☪️' },
  { match: /রান্না|রেসিপি/,     icon: '🍳' },
  { match: /ভ্রমণ/,             icon: '✈️' },
  { match: /রাজনীত/,            icon: '🏛️' },
  { match: /স্বাস্থ্য/,         icon: '🏥' },
  { match: /অনুবাদ/,            icon: '🌍' },
  { match: /জীবনী/,             icon: '👤' },
  { match: /অর্থনীত/,           icon: '💰' },
  { match: /থ্রিলার|রহস্য/,     icon: '🔍' },
  { match: /রোমান্স/,           icon: '❤️' },
  { match: /দর্শন/,             icon: '🤔' },
]

const COLOR_POOL = [
  '#e8a020','#0f766e','#6b2737','#1a2744',
  '#2563eb','#7c3aed','#059669','#dc2626',
  '#d97706','#0891b2','#65a30d','#c026d3',
]

function catIcon(name) {
  const hit = ICON_MAP.find(({ match }) => match.test(name))
  return hit ? hit.icon : '📚'
}

function catColor(idx) {
  return COLOR_POOL[idx % COLOR_POOL.length]
}

const BASE = 'http://localhost:5000/api'

export default function Categories() {
  const [visible,    setVisible]    = useState(false)
  const [categories, setCategories] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetch(`${BASE}/categories`)
      .then(r => r.json())
      .then(json => setCategories(json.data || (Array.isArray(json) ? json : [])))
      .catch(() => {})
  }, [])

  if (!categories.length) return null

  return (
    <section className="categories section" ref={ref} aria-label="সব বিভাগ">
      <div className="container">
        <SectionHeader
          label="বিভাগসমূহ"
          title="আপনার আগ্রহের বিষয়"
          subtitle="বিষয়ভিত্তিক বইয়ের বিশাল সংগ্রহ"
          align="center"
        />
        <div className={`categories__grid ${visible ? 'categories__grid--visible' : ''}`}>
          {categories.map((cat, i) => {
            const color = catColor(i)
            return (
              <Link
                key={cat.category_id}
                to={`/category/${cat.category_id}`}
                className="cat-card"
                style={{ transitionDelay: `${i * 45}ms` }}
                aria-label={cat.category_name}
              >
                <div
                  className="cat-card__icon"
                  style={{ background: `${color}18`, color }}
                >
                  {catIcon(cat.category_name)}
                </div>
                <strong className="cat-card__name">{cat.category_name}</strong>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
