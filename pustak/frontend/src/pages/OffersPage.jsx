import { Link } from 'react-router-dom'
import FilteredBookList from '../components/FilteredBookList'
import './ListPage.css'

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

export default function OffersPage() {
  return (
    <FilteredBookList
      scope="offers"
      minPct={1}
      renderHeader={({ total, loading }) => (
        <div className="list-page__header">
          <p className="list-page__breadcrumb"><Link to="/">হোম</Link> › আজকের অফার</p>
          <h1 className="list-page__title">আজকের বিশেষ অফার</h1>
          <p className="list-page__subtitle">ছাড়ে পাওয়া বই — সর্বোচ্চ ছাড় আগে</p>
          <p className="list-page__count">
            {loading ? 'লোড হচ্ছে...' : `${toBn(total)}টি বই`}
          </p>
        </div>
      )}
    />
  )
}
