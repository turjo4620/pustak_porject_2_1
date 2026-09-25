import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ShoppingBag, BookOpen, LayoutGrid, Users, Building2, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './account-dashboard.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])
const fmtPrice = (n) => {
  const num = Number(n)
  return toBn(Number.isInteger(num) ? String(num) : num.toFixed(2))
}

const TABS = [
  { value: 'books',      label: 'বই',      icon: BookOpen   },
  { value: 'categories', label: 'বিভাগ',   icon: LayoutGrid },
  { value: 'authors',    label: 'লেখক',    icon: Users      },
  { value: 'publishers', label: 'প্রকাশক', icon: Building2  },
]

const TAB_HINTS = {
  books:      'বইয়ের নাম বা লেখকের নাম লিখে খুঁজুন, তারপর সরাসরি কার্টে যোগ করুন।',
  categories: 'যেকোনো বিভাগে ক্লিক করলে সেই বিভাগের সব বই খুলে যাবে।',
  authors:    'যেকোনো লেখকের নামে ক্লিক করলে তাঁর সব বই খুলে যাবে।',
  publishers: 'যেকোনো প্রকাশনীতে ক্লিক করলে তাদের প্রকাশিত বইগুলো খুলে যাবে।',
}

export default function OrderDinPage() {
  const navigate = useNavigate()
  const { addToCart } = useApp()

  const [tab, setTab] = useState('books')
  const [q, setQ] = useState('')

  // ── Book search state ──
  const [books, setBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [addedId, setAddedId] = useState(null)

  // ── Entity lists (fetched once, filtered client-side) ──
  const [categories, setCategories] = useState(null)
  const [authors, setAuthors] = useState(null)
  const [publications, setPublications] = useState(null)
  const [entitiesLoading, setEntitiesLoading] = useState(true)

  // ── Fetch entity lists on mount ──
  useEffect(() => {
    Promise.all([
      fetch('https://putak-porject-2-1.onrender.com/api/categories').then(r => r.json()).catch(() => null),
      fetch('https://putak-porject-2-1.onrender.com/api/authors').then(r => r.json()).catch(() => null),
      fetch('https://putak-porject-2-1.onrender.com/api/publications').then(r => r.json()).catch(() => null),
    ])
      .then(([catJson, authJson, pubJson]) => {
        setCategories(catJson?.data || [])
        setAuthors(authJson?.data || [])
        setPublications(pubJson?.data || [])
        setEntitiesLoading(false)
      })
  }, [])

  // ── Debounced book search ──
  const seqRef = useRef(0)
  useEffect(() => {
    const term = q.trim()
    if (tab !== 'books' || !term) {
      setBooks([])
      setBooksLoading(false)
      return
    }

    const seq = ++seqRef.current
    setBooksLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://putak-porject-2-1.onrender.com/api/books/search?q=${encodeURIComponent(term)}&limit=24`)
        const json = await res.json()
        if (seq === seqRef.current) setBooks(json.data || [])
      } catch (err) {
        console.error('Book search error:', err)
        if (seq === seqRef.current) setBooks([])
      } finally {
        if (seq === seqRef.current) setBooksLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [q, tab])

  // ── Client-side entity filtering ──
  const filterList = (list, nameKey) => {
    if (!list) return []
    const term = q.trim().toLowerCase()
    if (!term) return list
    return list.filter((item) => String(item[nameKey] || '').toLowerCase().includes(term))
  }

  const visibleCategories = useMemo(() => filterList(categories, 'category_name'), [categories, q])
  const visibleAuthors    = useMemo(() => filterList(authors, 'name'), [authors, q])
  const visiblePublications = useMemo(() => filterList(publications, 'title'), [publications, q])

  // ── Add to cart ──
  const handleAdd = async (e, book) => {
    e.stopPropagation()
    try {
      await addToCart(book)
      setAddedId(book.id)
      setTimeout(() => setAddedId(null), 1500)
    } catch (err) {
      alert(err.message || 'কার্টে যোগ করা যায়নি')
    }
  }

  const showEmptyBooks = tab === 'books' && !booksLoading && q.trim() && books.length === 0

  return (
    <div className="od-section">

      {/* ── Header / search card ── */}
      <div className="card od-search-card">
        <div className="od-title-row">
          <ShoppingBag size={20} className="od-title-icon" />
          <h2 className="od-title">অর্ডার দিন</h2>
        </div>
        <p className="od-sub">বই খুঁজে অর্ডার করুন, অথবা বিভাগ / লেখক / প্রকাশক বেছে নিয়ে ব্রাউজ করুন।</p>

        <div className="orders-search-wrap">
          <Search size={16} className="orders-search-icon" />
          <input
            className="orders-search-input"
            placeholder={tab === 'books' ? 'বই বা লেখকের নাম লিখুন...' : 'নাম লিখে খুঁজুন...'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="orders-search-clear" onClick={() => setQ('')} aria-label="সার্চ মুছুন" type="button">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="orders-tabs od-tabs">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={`tab ${tab === value ? 'active' : ''}`}
              onClick={() => setTab(value)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <p className="od-tab-hint">{TAB_HINTS[tab]}</p>
      </div>

      {/* ── Results card ── */}
      <div className="card od-results-card">

        {/* Books */}
        {tab === 'books' && (
          booksLoading ? (
            <p className="od-empty">খুঁজছি...</p>
          ) : showEmptyBooks ? (
            <p className="od-empty">কোনো বই পাওয়া যায়নি। অন্য কিছু লিখে দেখুন।</p>
          ) : !q.trim() ? (
            <div className="od-prompt">
              <BookOpen size={40} className="od-prompt-icon" />
              <p>অনুসন্ধান করতে উপরে বইয়ের নাম বা লেখকের নাম লিখুন।</p>
              <p className="od-prompt-sub">বিভাগ, লেখক বা প্রকাশক ট্যাব থেকেও ব্রাউজ করতে পারেন।</p>
            </div>
          ) : (
            <div className="od-book-list">
              {books.map((b) => {
                const price = Number(b.price) || 0
                const discountPct = Number(b.discount_percentage) || 0
                const discounted = discountPct > 0
                  ? (Number(b.discount_price) || Math.round(price * (1 - discountPct / 100)))
                  : null
                return (
                  <div key={b.id} className="od-book-row" onClick={() => navigate(`/book/${b.id}`)}>
                    <div className="od-book-cover">
                      {b.cover_image_url && <img src={b.cover_image_url} alt={b.book_name} loading="lazy" />}
                    </div>
                    <div className="od-book-info">
                      <span className="od-book-title">{b.book_name}</span>
                      <span className="od-book-author">{b.author}</span>
                      <span className="od-book-price">
                        ৳{fmtPrice(discounted || price)}
                        {discounted && <s>৳{fmtPrice(price)}</s>}
                      </span>
                    </div>
                    <button
                      className={`od-add-btn ${addedId === b.id ? 'od-add-btn--added' : ''}`}
                      onClick={(e) => handleAdd(e, b)}
                      type="button"
                    >
                      <ShoppingCart size={14} />
                      {addedId === b.id ? 'যোগ হয়েছে' : 'কার্টে যোগ'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Categories */}
        {tab === 'categories' && (
          entitiesLoading ? (
            <p className="od-empty">লোড হচ্ছে...</p>
          ) : visibleCategories.length === 0 ? (
            <p className="od-empty">কোনো বিভাগ পাওয়া যায়নি।</p>
          ) : (
            <div className="od-entity-list">
              {visibleCategories.map((c) => (
                <button key={c.category_id} type="button" className="od-entity-btn"
                  onClick={() => navigate(`/category/${c.category_id}`)}>
                  <span className="od-entity-avatar od-entity-avatar--square"><LayoutGrid size={18} /></span>
                  <span className="od-entity-meta">
                    <span className="od-entity-name">{c.category_name}</span>
                    <span className="od-entity-count">{toBn(c.count || 0)} টি বই</span>
                  </span>
                </button>
              ))}
            </div>
          )
        )}

        {/* Authors */}
        {tab === 'authors' && (
          entitiesLoading ? (
            <p className="od-empty">লোড হচ্ছে...</p>
          ) : visibleAuthors.length === 0 ? (
            <p className="od-empty">কোনো লেখক পাওয়া যায়নি।</p>
          ) : (
            <div className="od-entity-list">
              {visibleAuthors.map((a) => (
                <button key={a.author_id} type="button" className="od-entity-btn"
                  onClick={() => navigate(`/author/${a.author_id}`)}>
                  <span className="od-entity-avatar">
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.name} loading="lazy" />
                      : (a.name || '?').charAt(0)}
                  </span>
                  <span className="od-entity-meta">
                    <span className="od-entity-name">{a.name}</span>
                    <span className="od-entity-count">{toBn(a.count || 0)} টি বই</span>
                  </span>
                </button>
              ))}
            </div>
          )
        )}

        {/* Publishers */}
        {tab === 'publishers' && (
          entitiesLoading ? (
            <p className="od-empty">লোড হচ্ছে...</p>
          ) : visiblePublications.length === 0 ? (
            <p className="od-empty">কোনো প্রকাশনী পাওয়া যায়নি।</p>
          ) : (
            <div className="od-entity-list">
              {visiblePublications.map((p) => (
                <button key={p.publication_id} type="button" className="od-entity-btn"
                  onClick={() => navigate(`/publisher/${p.publication_id}`)}>
                  <span className="od-entity-avatar od-entity-avatar--square">
                    {p.cover_image_url
                      ? <img src={p.cover_image_url} alt={p.title} loading="lazy" />
                      : (p.title || 'প্র').slice(0, 2)}
                  </span>
                  <span className="od-entity-meta">
                    <span className="od-entity-name">{p.title}</span>
                    <span className="od-entity-count">{toBn(p.book_count || 0)} টি বই</span>
                  </span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
