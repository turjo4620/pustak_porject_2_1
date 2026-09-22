import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FilteredBookList from '../components/FilteredBookList'
import './ListPage.css'
import './CategoryPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

export default function CategoryPage() {
  const { id } = useParams()

  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    fetch(`http://localhost:5000/api/categories/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCategoryName(json.data?.category_name || '')
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Fetch error:", err)
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="list-page">
        <div className="container">
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="list-page">
        <div className="container">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › <Link to="/categories">বিভাগ</Link>
          </p>
          <h1>বিভাগ খুঁজে পাওয়া যায়নি</h1>
          <p><Link to="/categories">সকল বিভাগ দেখুন</Link></p>
        </div>
      </div>
    )
  }

  return (
    <FilteredBookList
      categoryId={id}
      renderHeader={({ total }) => (
        <div className="list-page__header">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › <Link to="/categories">বিভাগ</Link> › {categoryName}
          </p>
          <h1 className="list-page__title">{categoryName}</h1>
          <p className="list-page__count">{toBn(total)} টি বই</p>
        </div>
      )}
    />
  )
}
