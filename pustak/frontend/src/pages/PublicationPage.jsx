import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FilteredBookList from '../components/FilteredBookList'
import './PublicationPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])

const getLogoText = (title) => {
  if (!title) return 'à¦ªà§à¦°'
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
          <p style={{ textAlign: 'center', padding: '2rem' }}>à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>
        </div>
      </div>
    )
  }

  if (notFound || !publication) {
    return (
      <div className="publication-page">
        <div className="container">
          <p className="list-page__breadcrumb">
            <Link to="/">à¦¹à§‹à¦®</Link> â€º <Link to="/publishers">à¦ªà§à¦°à¦•à¦¾à¦¶à¦•</Link>
          </p>
          <h1>à¦ªà§à¦°à¦•à¦¾à¦¶à¦¨à§€ à¦–à§à¦à¦œà§‡ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿</h1>
          <p><Link to="/publishers">à¦¸à¦•à¦² à¦ªà§à¦°à¦•à¦¾à¦¶à¦• à¦¦à§‡à¦–à§à¦¨</Link></p>
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
            <Link to="/">à¦¹à§‹à¦®</Link> â€º <Link to="/publishers">à¦ªà§à¦°à¦•à¦¾à¦¶à¦•</Link> â€º {publication.title}
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
              <p className="publication-page__book-count">{toBn(total)} à¦Ÿà¦¿ à¦¬à¦‡</p>
            </div>
          </div>
        </>
      )}
    />
  )
}

