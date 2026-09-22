import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FilteredBookList from '../components/FilteredBookList'
import './AuthorPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

export default function AuthorPage() {
  const { id } = useParams()

  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    fetch(`http://localhost:5000/api/authors/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAuthor(json.data)
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
      <div className="author-page">
        <div className="container">
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (notFound || !author) {
    return (
      <div className="author-page">
        <div className="container">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › <Link to="/authors">লেখক</Link>
          </p>
          <h1>লেখক খুঁজে পাওয়া যায়নি</h1>
          <p><Link to="/authors">সকল লেখক দেখুন</Link></p>
        </div>
      </div>
    )
  }

  return (
    <FilteredBookList
      authorId={id}
      renderHeader={({ total }) => (
        <>
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › <Link to="/authors">লেখক</Link> › {author.name}
          </p>

          <div className="author-page__header">
            <div className="author-page__avatar">
              {author.photo_url ? (
                <img src={author.photo_url} alt={author.name} />
              ) : (
                author.name ? author.name.charAt(0) : '?'
              )}
            </div>
            <div className="author-page__info">
              <h1>{author.name}</h1>
              {author.bio && <p className="author-page__bio">{author.bio}</p>}
              <p className="author-page__book-count">{toBn(total)} টি বই</p>
            </div>
          </div>
        </>
      )}
    />
  )
}
