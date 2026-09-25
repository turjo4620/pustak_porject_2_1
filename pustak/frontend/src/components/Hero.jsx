import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

const floatingBooks = [
  {
    id: 1, title: 'à¦¹à¦¿à¦®à§', author: 'à¦¹à§à¦®à¦¾à¦¯à¦¼à§‚à¦¨ à¦†à¦¹à¦®à§‡à¦¦',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=180&h=260&fit=crop&q=80',
    style: { top: '18%', left: '8%', width: 110, height: 160, animDelay: '0s', animDuration: '6s', rotate: '-8deg' },
  },
  {
    id: 2, title: 'à¦°à¦¬à§€à¦¨à§à¦¦à§à¦° à¦°à¦šà¦¨à¦¾à¦¬à¦²à§€', author: 'à¦°à¦¬à§€à¦¨à§à¦¦à§à¦°à¦¨à¦¾à¦¥ à¦ à¦¾à¦•à§à¦°',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=180&h=260&fit=crop&q=80',
    style: { top: '12%', right: '10%', width: 95, height: 140, animDelay: '1.2s', animDuration: '7s', rotate: '6deg' },
  },
  {
    id: 3, title: 'à¦à¦•à¦¾à¦¤à§à¦¤à¦°à§‡à¦° à¦¦à¦¿à¦¨à¦—à§à¦²à¦¿', author: 'à¦œà¦¾à¦¹à¦¾à¦¨à¦¾à¦°à¦¾ à¦‡à¦®à¦¾à¦®',
    cover: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=180&h=260&fit=crop&q=80',
    style: { bottom: '20%', left: '12%', width: 100, height: 148, animDelay: '2s', animDuration: '8s', rotate: '5deg' },
  },
  {
    id: 4, title: 'à¦¦à§‡à¦¯à¦¼à¦¾à¦²', author: 'à¦¹à§à¦®à¦¾à¦¯à¦¼à§‚à¦¨ à¦†à¦¹à¦®à§‡à¦¦',
    cover: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=180&h=260&fit=crop&q=80',
    style: { bottom: '24%', right: '8%', width: 90, height: 132, animDelay: '0.7s', animDuration: '6.5s', rotate: '-5deg' },
  },
  {
    id: 5, title: 'à¦†à¦®à¦¾à¦° à¦›à§‡à¦²à§‡à¦¬à§‡à¦²à¦¾', author: 'à¦¸à§à¦¨à§€à¦² à¦—à¦™à§à¦—à§‹à¦ªà¦¾à¦§à§à¦¯à¦¾à¦¯à¦¼',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=180&h=260&fit=crop&q=80',
    style: { top: '45%', right: '3%', width: 80, height: 118, animDelay: '3s', animDuration: '9s', rotate: '10deg' },
  },
  {
    id: 6, title: 'à¦¶à§‡à¦° à¦¶à¦¾à¦¹ à¦¸à§à¦°à¦¿', author: 'à¦®à§à¦¹à¦®à§à¦®à¦¦ à¦œà¦¾à¦«à¦° à¦‡à¦•à¦¬à¦¾à¦²',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=180&h=260&fit=crop&q=80',
    style: { top: '50%', left: '3%', width: 78, height: 115, animDelay: '1.8s', animDuration: '7.5s', rotate: '-12deg' },
  },
]

const quotes = [
  { text: 'â€œà¦¬à¦‡ à¦•à¦¿à¦¨à§‡ à¦•à§‡à¦‰ à¦¤à§‹ à¦•à¦–à¦¨à§‹ à¦¦à§‡à¦‰à¦²à§‡ à¦¹à¦¯à¦¼ à¦¨à¦¿à¥¤â€', attr: 'â€” à¦¸à§ˆà¦¯à¦¼à¦¦ à¦®à§à¦œà¦¤à¦¬à¦¾ à¦†à¦²à§€' },
  { text: 'â€œà¦¬à¦‡ à¦¹à¦šà§à¦›à§‡ à¦…à¦¤à§€à¦¤ à¦†à¦° à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨à§‡à¦° à¦®à¦§à§à¦¯à§‡ à¦¬à§‡à¦à¦§à§‡ à¦¦à§‡à¦¯à¦¼à¦¾ à¦¸à¦¾à¦à¦•à§‹à¥¤â€', attr: 'â€” à¦°à¦¬à§€à¦¨à§à¦¦à§à¦°à¦¨à¦¾à¦¥ à¦ à¦¾à¦•à§à¦°' },
  { text: 'â€œà¦¬à¦‡ à¦¹à¦šà§à¦›à§‡ à¦¶à§à¦°à§‡à¦·à§à¦  à¦†à¦¤à§à¦®à§€à¦¯à¦¼, à¦¯à¦¾à¦° à¦¸à¦™à§à¦—à§‡ à¦•à§‹à¦¨à¦¦à¦¿à¦¨ à¦à¦—à¦¡à¦¼à¦¾ à¦¹à¦¯à¦¼ à¦¨à¦¾, à¦•à§‹à¦¨à¦¦à¦¿à¦¨ à¦®à¦¨à§‹à¦®à¦¾à¦²à¦¿à¦¨à§à¦¯ à¦¹à¦¯à¦¼ à¦¨à¦¾à¥¤â€', attr: 'â€” à¦ªà§à¦°à¦¤à¦¿à¦­à¦¾ à¦¬à¦¸à§' },
  { text: 'â€œà¦¬à¦‡ à¦ªà¦¡à¦¼à¦¾à¦•à§‡ à¦¯à¦¥à¦¾à¦°à§à¦¥ à¦¹à¦¿à¦¸à§‡à¦¬à§‡ à¦¯à§‡ à¦¸à¦™à§à¦—à§€ à¦•à¦°à§‡ à¦¨à¦¿à¦¤à§‡ à¦ªà¦¾à¦°à§‡, à¦¤à¦¾à¦° à¦œà§€à¦¬à¦¨à§‡à¦° à¦¦à§à¦ƒà¦–-à¦•à¦·à§à¦Ÿà§‡à¦° à¦¬à§‹à¦à¦¾ à¦…à¦¨à§‡à¦• à¦•à¦®à§‡ à¦¯à¦¾à¦¯à¦¼à¥¤â€', attr: 'â€” à¦¶à¦°à§Žà¦šà¦¨à§à¦¦à§à¦° à¦šà¦Ÿà§à¦Ÿà§‹à¦ªà¦¾à¦§à§à¦¯à¦¾à¦¯à¦¼' },
  { text: 'â€œà¦šà§‹à¦– à¦¬à¦¾à¦¡à¦¼à¦¾à¦¬à¦¾à¦° à¦ªà¦¨à§à¦¥à¦¾à¦Ÿà¦¾ à¦•à§€? à¦ªà§à¦°à¦¥à¦®à¦¤â€”à¦¬à¦‡ à¦ªà¦¡à¦¼à¦¾ à¦à¦¬à¦‚ à¦¤à¦¾à¦° à¦œà¦¨à§à¦¯ à¦¦à¦°à¦•à¦¾à¦° à¦¬à¦‡ à¦•à§‡à¦¨à¦¾à¦° à¦ªà§à¦°à¦¬à§ƒà¦¤à§à¦¤à¦¿à¥¤â€', attr: 'â€” à¦¸à§ˆà¦¯à¦¼à¦¦ à¦®à§à¦œà¦¤à¦¬à¦¾ à¦†à¦²à§€, à¦¬à¦‡ à¦•à§‡à¦¨à¦¾' },
  { text: 'â€œà¦°à§à¦Ÿà¦¿ à¦®à¦¦ à¦«à§à¦°à¦¿à¦¯à¦¼à§‡ à¦¯à¦¾à¦¬à§‡, à¦ªà§à¦°à¦¿à¦¯à¦¼à¦¾à¦° à¦•à¦¾à¦²à§‹ à¦šà§‹à¦– à¦˜à§‹à¦²à¦¾à¦Ÿà§‡ à¦¹à¦¯à¦¼à§‡ à¦†à¦¸à¦¬à§‡, à¦•à¦¿à¦¨à§à¦¤à§ à¦¬à¦‡à¦–à¦¾à¦¨à¦¾ à¦…à¦¨à¦¨à§à¦¤-à¦¯à§Œà¦¬à¦¨à¦¾â€”à¦¯à¦¦à¦¿ à¦¤à§‡à¦®à¦¨ à¦¬à¦‡ à¦¹à¦¯à¦¼à¥¤â€', attr: 'â€” à¦¸à§ˆà¦¯à¦¼à¦¦ à¦®à§à¦œà¦¤à¦¬à¦¾ à¦†à¦²à§€, à¦¬à¦‡ à¦•à§‡à¦¨à¦¾' },
  { text: 'â€œà¦…à¦¤à¦²à¦¸à§à¦ªà¦°à§à¦¶ à¦•à¦¾à¦²à¦¸à¦®à§à¦¦à§à¦°à§‡à¦° à¦‰à¦ªà¦° à¦•à§‡à¦¬à¦² à¦à¦•-à¦à¦•à¦–à¦¾à¦¨à¦¿ à¦¬à¦‡ à¦¦à¦¿à¦¯à¦¼à¦¾ à¦¸à¦¾à¦à¦•à§‹ à¦¬à¦¾à¦à¦§à¦¿à¦¯à¦¼à¦¾ à¦¦à¦¿à¦¬à§‡à¥¤â€', attr: 'â€” à¦°à¦¬à§€à¦¨à§à¦¦à§à¦°à¦¨à¦¾à¦¥ à¦ à¦¾à¦•à§à¦°' },
]

const toBn = (n) => String(n).replace(/[0-9]/g, d => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])

function fmtCount(n) {
  if (!n) return 'â€”'
  if (n >= 100000) return `${toBn(Math.floor(n / 100000))} à¦²à¦•à§à¦·+`
  if (n >= 1000)   return `${toBn(Math.floor(n / 1000))},à§¦à§¦à§¦+`
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
    <section className="hero" ref={heroRef} aria-label="à¦¨à¦¾à¦¯à¦¼à¦• à¦¬à¦¿à¦­à¦¾à¦—">
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
          <Link to="/offers" className="hero__promo" aria-label="à¦†à¦œà¦•à§‡à¦° à¦…à¦«à¦¾à¦° à¦¦à§‡à¦–à§à¦¨">
            <span className="hero__promo-tag">à¦¬à¦¿à¦¶à§‡à¦· à¦…à¦«à¦¾à¦°</span>
            <span className="hero__promo-copy">
              à¦ªà§à¦°à¦¥à¦® à¦…à¦°à§à¦¡à¦¾à¦°à§‡ <strong>à§§à§¦% à¦›à¦¾à¦¡à¦¼</strong>
            </span>
            <span className="hero__promo-action">à¦…à¦«à¦¾à¦° à¦¦à§‡à¦–à§à¦¨ <span aria-hidden="true">â†’</span></span>
          </Link>

          <div className="hero__badge">
            <span>à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶à§‡à¦° à¦¸à§‡à¦°à¦¾ à¦¬à¦‡à¦¯à¦¼à§‡à¦° à¦¦à§‹à¦•à¦¾à¦¨</span>
          </div>
        </div>

        <h1 className="hero__title">
          <span className="hero__title-line">à¦œà§à¦žà¦¾à¦¨à§‡à¦° à¦†à¦²à§‹à¦¯à¦¼</span>
          <span className="hero__title-line hero__title-line--accent">à¦†à¦²à§‹à¦•à¦¿à¦¤ à¦¹à§‹à¦¨</span>
        </h1>

        <div className="hero__quote-wrap" key={quoteIdx}>
          <p className="hero__quote">{quotes[quoteIdx].text}</p>
          <span className="hero__quote-attr">{quotes[quoteIdx].attr}</span>
        </div>

        <div className="hero__stats">
          <div className="hero__stat">
            <strong>{stats.totalBooks ? fmtCount(stats.totalBooks) : 'à§«à§¦,à§¦à§¦à§¦+'}</strong>
            <span>à¦¬à¦‡</span>
          </div>
          <div className="hero__stat-divider" aria-hidden="true" />
          <div className="hero__stat">
            <strong>{stats.totalAuthors ? fmtCount(stats.totalAuthors) : 'à§§,à§¦à§¦à§¦+'}</strong>
            <span>à¦²à§‡à¦–à¦•</span>
          </div>
          <div className="hero__stat-divider" aria-hidden="true" />
          <div className="hero__stat">
            <strong>à§« à¦²à¦•à§à¦·+</strong>
            <span>à¦®à§‹à¦Ÿ à¦ªà¦¾à¦ à¦•</span>
          </div>
        </div>

        <div className="hero__cta-group">
          <Link to="/bestsellers" className="hero__btn hero__btn--primary">
            à¦¬à¦‡ à¦¦à§‡à¦–à¦¾ à¦¶à§à¦°à§ à¦•à¦°à§à¦¨
          </Link>
          <Link to="/new-arrivals" className="hero__btn hero__btn--ghost">
            à¦¨à¦¤à§à¦¨ à¦¬à¦‡ à¦¦à§‡à¦–à§à¦¨
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" aria-label="à¦¨à¦¿à¦šà§‡ à¦¸à§à¦•à§à¦°à¦² à¦•à¦°à§à¦¨">
        <div className="hero__scroll-dot" />
        <span>à¦¨à¦¿à¦šà§‡ à¦¸à§à¦•à§à¦°à¦² à¦•à¦°à§à¦¨</span>
      </div>
    </section>
  )
}

