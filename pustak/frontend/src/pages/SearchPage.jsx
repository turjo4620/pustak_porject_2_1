import { useSearchParams, Link } from 'react-router-dom'
import FilteredBookList from '../components/FilteredBookList'
import './ListPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()

  if (!q) {
    return (
      <div className="list-page">
        <div className="container">
          <div className="list-page__header">
            <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › অনুসন্ধান</p>
            <h1 className="list-page__title">বই খুঁজুন</h1>
            <p className="list-page__count">উপরের সার্চ বার ব্যবহার করে বই খুঁজুন</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FilteredBookList
      q={q}
      renderHeader={({ total, loading }) => (
        <div className="list-page__header">
          <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › অনুসন্ধান ফলাফল</p>
          <h1 className="list-page__title">"{q}" এর ফলাফল</h1>
          <p className="list-page__count">
            {loading ? 'খুঁজছি...' : `${toBn(total)} টি বই পাওয়া গেছে`}
          </p>
        </div>
      )}
    />
  )
}
