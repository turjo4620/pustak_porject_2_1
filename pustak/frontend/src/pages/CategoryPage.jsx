import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FilteredBookList from '../components/FilteredBookList'
import './ListPage.css'
import './CategoryPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])

export default function CategoryPage() {
  const { id } = useParams()

  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    fetch(`https://putak-porject-2-1.onrender.com/api/categories/${id}`)
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
          <p style={{ textAlign: 'center', padding: '2rem' }}>à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="list-page">
        <div className="container">
          <p className="list-page__breadcrumb">
            <Link to="/">à¦¹à§‹à¦®</Link> â€º <Link to="/categories">à¦¬à¦¿à¦­à¦¾à¦—</Link>
          </p>
          <h1>à¦¬à¦¿à¦­à¦¾à¦— à¦–à§à¦à¦œà§‡ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿</h1>
          <p><Link to="/categories">à¦¸à¦•à¦² à¦¬à¦¿à¦­à¦¾à¦— à¦¦à§‡à¦–à§à¦¨</Link></p>
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
            <Link to="/">à¦¹à§‹à¦®</Link> â€º <Link to="/categories">à¦¬à¦¿à¦­à¦¾à¦—</Link> â€º {categoryName}
          </p>
          <h1 className="list-page__title">{categoryName}</h1>
          <p className="list-page__count">{toBn(total)} à¦Ÿà¦¿ à¦¬à¦‡</p>
        </div>
      )}
    />
  )
}

