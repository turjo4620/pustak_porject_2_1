import { useState } from 'react'
import { Send, Check } from 'lucide-react'
import { api } from '../api/http'
import './Newsletter.css'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (email && !loading) {
      setLoading(true)
      setError('')
      try {
        await api.post('/newsletter/subscribe', { email })
        setSubmitted(true)
        setEmail('')
      } catch (err) {
        setError(err.message || 'সাবস্ক্রাইব করা যায়নি')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <section className="newsletter" aria-label="নিউজলেটার সদস্যতা">
      <div className="container">
        <div className="newsletter__inner">
          <div className="newsletter__bg" aria-hidden="true">
            <div className="newsletter__bg-shape newsletter__bg-shape--1" />
            <div className="newsletter__bg-shape newsletter__bg-shape--2" />
          </div>

          <div className="newsletter__content">
            <span className="newsletter__label">নিউজলেটার</span>
            <h2 className="newsletter__title">বইয়ের জগতে আপডেট থাকুন</h2>
            <p className="newsletter__subtitle">
              নতুন প্রকাশনা, বিশেষ অফার এবং পাঠ্য পরামর্শ সরাসরি আপনার ইনবক্সে
            </p>

            {submitted ? (
              <div className="newsletter__success" role="status">
                <Check size={22} />
                <span>ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন।</span>
              </div>
            ) : (
              <form className="newsletter__form" onSubmit={handleSubmit} aria-label="ইমেইল সাবস্ক্রিপশন">
                <div className="newsletter__input-group">
                  <input
                    type="email"
                    className="newsletter__input"
                    placeholder="আপনার ইমেইল ঠিকানা"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="ইমেইল ঠিকানা"
                  />
                  <button type="submit" className="newsletter__btn" aria-label="সাবস্ক্রাইব করুন">
                    <Send size={16} />
                    {loading ? 'যাচাই হচ্ছে...' : 'সাবস্ক্রাইব'}
                  </button>
                </div>
                {error && <p className="newsletter__error" role="alert">{error}</p>}
                <p className="newsletter__note">কোনো স্প্যাম নয়। যেকোনো সময় আনসাবস্ক্রাইব করুন।</p>
              </form>
            )}

            <div className="newsletter__stats" aria-label="পরিসংখ্যান">
              <div className="newsletter__stat">
                <strong>২৫,০০০+</strong>
                <span>সদস্য</span>
              </div>
              <div className="newsletter__stat-divider" aria-hidden="true" />
              <div className="newsletter__stat">
                <strong>সাপ্তাহিক</strong>
                <span>আপডেট</span>
              </div>
              <div className="newsletter__stat-divider" aria-hidden="true" />
              <div className="newsletter__stat">
                <strong>বিনামূল্যে</strong>
                <span>সদস্যতা</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
