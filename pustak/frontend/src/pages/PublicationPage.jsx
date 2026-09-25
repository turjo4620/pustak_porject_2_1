import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FilteredBookList from '../components/FilteredBookList'
import './PublicationPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

const getLogoText = (title) => {
  if (!title) return 'প্র'
  const words = title.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2)
  }
  return words.slice(0, 2).map(word => word[0]).join('')
}

export default function PublicationPage() {
  const { id } = useParams()

  const [publication, setPublication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    fetch(`https://putak-porject-2-1.onrender.com/api/publications/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPublication(json.data)
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
      <div className="publication-page">
        <div className="container">
          <p style={{ textAlign: 'center', padding: '2rem' }}>লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (notFound || !publication) {
    return (
      <div className="publication-page">
        <div className="container">
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › <Link to="/publishers">প্রকাশক</Link>
          </p>
          <h1>প্রকাশনী খুঁজে পাওয়া যায়নি</h1>
          <p><Link to="/publishers">সকল প্রকাশক দেখুন</Link></p>
        </div>
      </div>
    )
  }

  return (
    <FilteredBookList
      publisherId={id}
      renderHeader={({ total }) => (
        <>
          <p className="list-page__breadcrumb">
            <Link to="/">হোম</Link> › <Link to="/publishers">প্রকাশক</Link> › {publication.title}
          </p>

          <div className="publication-page__header">
            <div className="publication-page__avatar">
              {publication.cover_image_url ? (
                <img src={publication.cover_image_url} alt={publication.title} />
              ) : (
                getLogoText(publication.title)
              )}
            </div>
            <div className="publication-page__info">
              <h1>{publication.title}</h1>
              {publication.bio && <p className="publication-page__bio">{publication.bio}</p>}
              <p className="publication-page__book-count">{toBn(total)} টি বই</p>
            </div>
          </div>
        </>
      )}
    />
  )
}
