import { Link } from 'react-router-dom'
import FilteredBookList from '../components/FilteredBookList'
import './ListPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

export default function NewArrivalsPage() {
  return (
    <FilteredBookList
      scope="new_arrivals"
      renderHeader={({ total, loading }) => (
        <div className="list-page__header">
          <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › নতুন বই</p>
          <h1 className="list-page__title">নতুন প্রকাশিত বই</h1>
          <p className="list-page__count">
            {loading ? 'লোড হচ্ছে...' : `${toBn(total)}টি সর্বশেষ প্রকাশিত বই`}
          </p>
        </div>
      )}
    />
  )
}
