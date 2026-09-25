import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './ListPage.css'
import './CategoriesPage.css'

export default function CategoriesPage() {
  // state
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // fetch
  useEffect(() => {
    fetch('https://putak-porject-2-1.onrender.com/api/categories')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCategories(json.data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Fetch error:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="list-page">
      <div className="container">
        <div className="list-page__header">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › বিভাগ
          </p>
          <h1>বিভাগসমূহ</h1>
          <p className="list-page__subtitle">নীচে {categories.length}টি প্রধান বিভাগ দেখুন</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
        ) : (
          <div className="categories-list-grid">
            {categories.map((category) => (
              <Link
                key={category.category_id}
                to={`/category/${category.category_id}`}
                className="category-card"
              >
                <span className="category-card__name">{category.category_name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
