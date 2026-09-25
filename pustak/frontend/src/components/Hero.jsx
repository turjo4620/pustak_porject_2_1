import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const BASE = 'http://localhost:5000/api'

const floatingBooks = [
  {
    id: 1, title: 'হিমু', author: 'হুমায়ূন আহমেদ',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=180&h=260&fit=crop&q=80',
    style: { top: '18%', left: '8%', width: 110, height: 160, animDelay: '0s', animDuration: '6s', rotate: '-8deg' },
  },
  {
    id: 2, title: 'রবীন্দ্র রচনাবলী', author: 'রবীন্দ্রনাথ ঠাকুর',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=180&h=260&fit=crop&q=80',
    style: { top: '12%', right: '10%', width: 95, height: 140, animDelay: '1.2s', animDuration: '7s', rotate: '6deg' },
  },
  {
    id: 3, title: 'একাত্তরের দিনগুলি', author: 'জাহানারা ইমাম',
    cover: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=180&h=260&fit=crop&q=80',
    style: { bottom: '20%', left: '12%', width: 100, height: 148, animDelay: '2s', animDuration: '8s', rotate: '5deg' },
  },
  {
    id: 4, title: 'দেয়াল', author: 'হুমায়ূন আহমেদ',
    cover: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=180&h=260&fit=crop&q=80',
    style: { bottom: '24%', right: '8%', width: 90, height: 132, animDelay: '0.7s', animDuration: '6.5s', rotate: '-5deg' },
  },
  {
    id: 5, title: 'আমার ছেলেবেলা', author: 'সুনীল গঙ্গোপাধ্যায়',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=180&h=260&fit=crop&q=80',
    style: { top: '45%', right: '3%', width: 80, height: 118, animDelay: '3s', animDuration: '9s', rotate: '10deg' },
  },
  {
    id: 6, title: 'শের শাহ সুরি', author: 'মুহম্মদ জাফর ইকবাল',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=180&h=260&fit=crop&q=80',
    style: { top: '50%', left: '3%', width: 78, height: 115, animDelay: '1.8s', animDuration: '7.5s', rotate: '-12deg' },
  },
]

const quotes = [
  { text: '“বই কিনে কেউ তো কখনো দেউলে হয় নি।”', attr: '— সৈয়দ মুজতবা আলী' },
  { text: '“বই হচ্ছে অতীত আর বর্তমানের মধ্যে বেঁধে দেয়া সাঁকো।”', attr: '— রবীন্দ্রনাথ ঠাকুর' },
  { text: '“বই হচ্ছে শ্রেষ্ঠ আত্মীয়, যার সঙ্গে কোনদিন ঝগড়া হয় না, কোনদিন মনোমালিন্য হয় না।”', attr: '— প্রতিভা বসু' },
  { text: '“বই পড়াকে যথার্থ হিসেবে যে সঙ্গী করে নিতে পারে, তার জীবনের দুঃখ-কষ্টের বোঝা অনেক কমে যায়।”', attr: '— শরৎচন্দ্র চট্টোপাধ্যায়' },
  { text: '“চোখ বাড়াবার পন্থাটা কী? প্রথমত—বই পড়া এবং তার জন্য দরকার বই কেনার প্রবৃত্তি।”', attr: '— সৈয়দ মুজতবা আলী, বই কেনা' },
  { text: '“রুটি মদ ফুরিয়ে যাবে, প্রিয়ার কালো চোখ ঘোলাটে হয়ে আসবে, কিন্তু বইখানা অনন্ত-যৌবনা—যদি তেমন বই হয়।”', attr: '— সৈয়দ মুজতবা আলী, বই কেনা' },
  { text: '“অতলস্পর্শ কালসমুদ্রের উপর কেবল এক-একখানি বই দিয়া সাঁকো বাঁধিয়া দিবে।”', attr: '— রবীন্দ্রনাথ ঠাকুর' },
]

const toBn = (n) => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d])

function fmtCount(n) {
  if (!n) return '—'
  if (n >= 100000) return `${toBn(Math.floor(n / 100000))} লক্ষ+`
  if (n >= 1000)   return `${toBn(Math.floor(n / 1000))},০০০+`
  return `${toBn(n)}+`
}

export default function Hero() {
  const [visible,  setVisible]  = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [stats,    setStats]    = useState({ totalBooks: null, totalAuthors: null })
  const heroRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(i => (i + 1) % quotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch live stats
  useEffect(() => {
    fetch(`${BASE}/books?page=1&limit=1`)
      .then(r => r.json())
      .then(json => {
        const total = json.total || json.totalBooks || null
        setStats(s => ({ ...s, totalBooks: total }))
      })
      .catch(() => {})

    fetch(`${BASE}/authors`)
      .then(r => r.json())
      .then(json => {
        const list = json.data || (Array.isArray(json) ? json : [])
        setStats(s => ({ ...s, totalAuthors: list.length || null }))
      })
      .catch(() => {})
  }, [])

  // Parallax on mouse move
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const onMove = (e) => {
      const { clientX, clientY } = e
      const { left, top, width, height } = hero.getBoundingClientRect()
      const x = (clientX - left) / width - 0.5
      const y = (clientY - top) / height - 0.5
      hero.querySelectorAll('.hero__book').forEach((book, i) => {
        const depth = (i % 3 + 1) * 10
        book.style.transform = `rotate(${book.dataset.rotate}) translate(${x * depth}px, ${y * depth}px)`
      })
    }
    hero.addEventListener('mousemove', onMove)
    return () => hero.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="hero" ref={heroRef} aria-label="নায়ক বিভাগ">
      {/* Ambient background */}
      <div className="hero__ambient" aria-hidden="true">
        <div className="hero__ambient-circle hero__ambient-circle--1" />
        <div className="hero__ambient-circle hero__ambient-circle--2" />
        <div className="hero__ambient-circle hero__ambient-circle--3" />
      </div>

      {/* Floating books */}
      <div className="hero__books" aria-hidden="true">
        {floatingBooks.map((book) => (
          <div
            key={book.id}
            className="hero__book"
            data-rotate={book.style.rotate}
            style={{
              position: 'absolute',
              top: book.style.top, bottom: book.style.bottom,
              left: book.style.left, right: book.style.right,
              width: book.style.width, height: book.style.height,
              transform: `rotate(${book.style.rotate})`,
              animationDelay: book.style.animDelay,
              animationDuration: book.style.animDuration,
            }}
          >
            <div className="hero__book-cover">
              <img src={book.cover} alt={book.title} loading="lazy" />
              <div className="hero__book-spine" />
              <div className="hero__book-shadow" />
            </div>
          </div>
        ))}
      </div>

      {/* Central content */}
      <div className={`hero__content ${visible ? 'hero__content--visible' : ''}`}>
        <div className="hero__badges">
          <Link to="/offers" className="hero__promo" aria-label="আজকের অফার দেখুন">
            <span className="hero__promo-tag">বিশেষ অফার</span>
            <span className="hero__promo-copy">
              প্রথম অর্ডারে <strong>১০% ছাড়</strong>
            </span>
            <span className="hero__promo-action">অফার দেখুন <span aria-hidden="true">→</span></span>
          </Link>

          <div className="hero__badge">
            <span>বাংলাদেশের সেরা বইয়ের দোকান</span>
          </div>
        </div>

        <h1 className="hero__title">
          <span className="hero__title-line">জ্ঞানের আলোয়</span>
          <span className="hero__title-line hero__title-line--accent">আলোকিত হোন</span>
        </h1>

        <div className="hero__quote-wrap" key={quoteIdx}>
          <p className="hero__quote">{quotes[quoteIdx].text}</p>
          <span className="hero__quote-attr">{quotes[quoteIdx].attr}</span>
        </div>

        <div className="hero__stats">
          <div className="hero__stat">
            <strong>{stats.totalBooks ? fmtCount(stats.totalBooks) : '৫০,০০০+'}</strong>
            <span>বই</span>
          </div>
          <div className="hero__stat-divider" aria-hidden="true" />
          <div className="hero__stat">
            <strong>{stats.totalAuthors ? fmtCount(stats.totalAuthors) : '১,০০০+'}</strong>
            <span>লেখক</span>
          </div>
          <div className="hero__stat-divider" aria-hidden="true" />
          <div className="hero__stat">
            <strong>৫ লক্ষ+</strong>
            <span>মোট পাঠক</span>
          </div>
        </div>

        <div className="hero__cta-group">
          <Link to="/bestsellers" className="hero__btn hero__btn--primary">
            বই দেখা শুরু করুন
          </Link>
          <Link to="/new-arrivals" className="hero__btn hero__btn--ghost">
            নতুন বই দেখুন
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" aria-label="নিচে স্ক্রল করুন">
        <div className="hero__scroll-dot" />
        <span>নিচে স্ক্রল করুন</span>
      </div>
    </section>
  )
}
