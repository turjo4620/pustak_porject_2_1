import { Link } from 'react-router-dom'
import FilteredBookList from '../components/FilteredBookList'
import './ListPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

export default function BestSellersPage() {
  return (
    <FilteredBookList
      scope="bestsellers"
      renderHeader={({ total, loading }) => (
        <div className="list-page__header">
          <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › বেস্টসেলার</p>
          <h1 className="list-page__title">বেস্টসেলার বই</h1>
          <p className="list-page__count">
            {loading ? 'লোড হচ্ছে...' : `সবচেয়ে বেশি পড়া ${toBn(total)} টি বই`}
          </p>
        </div>
      )}
    />
  )
}
