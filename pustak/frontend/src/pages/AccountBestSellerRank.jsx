import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, ArrowLeft, ShoppingBag, WalletCards, Users } from 'lucide-react'
import { api } from '../api/http'
import './account-dashboard.css'
import './AccountBestSellerRank.css'

const toBn = (value) => String(value).replace(/[0-9]/g, digit => '০১২৩৪৫৬৭৮৯'[digit])

export default function AccountBestSellerRank() {
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/orders/buyer-rank')
      .then(setRanking)
      .catch(err => setError(err.message || 'র‍্যাংকিং লোড করা যায়নি'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="abr-root">
      <div className="abr-header">
        <div>
          <Link to="/account" className="abr-back"><ArrowLeft size={15} /> অ্যাকাউন্টে ফিরুন</Link>
          <p className="abr-eyebrow"><Trophy size={15} /> আমার র‍্যাংকিং</p>
          <h1>সেরা ক্রেতার তালিকায় আপনার অবস্থান</h1>
          <p>অন্য ক্রেতাদের তুলনায় আপনার কেনাকাটার অবস্থান দেখুন।</p>
        </div>
        <Trophy className="abr-header__icon" size={58} strokeWidth={1.2} aria-hidden="true" />
      </div>

      {loading && <div className="abr-state">র‍্যাংকিং লোড হচ্ছে...</div>}
      {!loading && error && <div className="abr-state abr-state--error">{error}</div>}
      {!loading && !error && !ranking?.rank && (
        <div className="abr-state abr-state--empty">
          <ShoppingBag size={30} />
          <strong>আপনার এখনও কোনো ক্রেতা র‍্যাংকিং নেই</strong>
          <span>অর্ডার সম্পন্ন হলে সেরা ক্রেতার তালিকায় আপনার অবস্থান দেখা যাবে।</span>
          <Link to="/account/order" className="abr-action">বই কিনুন</Link>
        </div>
      )}
      {!loading && !error && ranking?.rank && (
        <div className="abr-summary">
          <div className="abr-rank-hero">
            <Trophy size={28} />
            <span>আপনার অবস্থান</span>
            <strong>#{toBn(ranking.rank)}</strong>
            <small>মোট {toBn(ranking.total_buyers)} জন ক্রেতার মধ্যে</small>
          </div>
          <div className="abr-metrics">
            <div className="abr-metric"><ShoppingBag size={20} /><span>মোট অর্ডার</span><strong>{toBn(ranking.total_orders)}</strong></div>
            <div className="abr-metric"><WalletCards size={20} /><span>মোট খরচ</span><strong>৳{toBn(Number(ranking.total_spent || 0).toFixed(2))}</strong></div>
            <div className="abr-metric"><Users size={20} /><span>র‍্যাংকিংয়ের ভিত্তি</span><strong>খরচ, তারপর অর্ডার</strong></div>
          </div>
        </div>
      )}
    </div>
  )
}