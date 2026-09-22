import { Link, useNavigate } from 'react-router-dom'
import './Footer.css'

// ── "বই খুঁজুন" — link to /categories page and direct category search ──────
const bookCategories = [
  { label: 'উপন্যাস',      to: '/search?q=উপন্যাস'      },
  { label: 'কবিতা',        to: '/search?q=কবিতা'        },
  { label: 'বিজ্ঞান',      to: '/search?q=বিজ্ঞান'      },
  { label: 'ইতিহাস',       to: '/search?q=ইতিহাস'       },
  { label: 'আত্মউন্নয়ন',  to: '/search?q=আত্মউন্নয়ন'  },
  { label: 'শিশুদের বই',   to: '/search?q=শিশুদের বই'   },
]

// ── Help links — for now scroll/hash placeholders but with readable paths ──
const helpLinks = [
  { label: 'অর্ডার ট্র্যাক',  to: '/account/orders'   },
  { label: 'রিটার্ন নীতি',    to: '/account/returns'  },
  { label: 'ডেলিভারি তথ্য',   to: '/search?q=ডেলিভারি' },
  { label: 'প্রশ্ন উত্তর',    to: '/search?q=সাহায্য'  },
]

// ── Company — placeholder routes (404 → NotFound handles gracefully) ─────────
const companyLinks = [
  { label: 'আমাদের সম্পর্কে', to: '/about'   },
  { label: 'ব্লগ',             to: '/blog'    },
  { label: 'চাকরি',            to: '/careers' },
  { label: 'যোগাযোগ',         to: '/contact' },
]

// ── Social — real platform URLs (replace href values when accounts exist) ────
const socialLinks = [
  { name: 'Facebook',  icon: 'ফ',  href: 'https://facebook.com'  },
  { name: 'Instagram', icon: 'ই',  href: 'https://instagram.com' },
  { name: 'Twitter',   icon: 'ট',  href: 'https://twitter.com'   },
  { name: 'YouTube',   icon: 'ই',  href: 'https://youtube.com'   },
]

const payments = ['Visa', 'MasterCard', 'bKash', 'Nagad', 'DBBL']

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__top">

          {/* ── Brand ── */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo" aria-label="পুস্তক হোম">
              <svg width="100" height="40" viewBox="0 0 100 40" fill="none"
                xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 33 Q28 37 50 35 Q72 33 94 36"
                  stroke="currentColor" strokeWidth="1.2"
                  strokeLinecap="round" fill="none" opacity="0.3"/>
                <text x="50" y="27" textAnchor="middle"
                  fontFamily="'Noto Serif Bengali', serif"
                  fontWeight="700" fontSize="23" fill="currentColor">পুস্তক</text>
              </svg>
            </Link>
            <p className="footer__tagline">
              বাংলাদেশের সেরা অনলাইন বইয়ের দোকান। জ্ঞান, সংস্কৃতি ও সাহিত্যের ডিজিটাল সেতু।
            </p>
            <div className="footer__social" aria-label="সোশ্যাল মিডিয়া">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  className="footer__social-btn"
                  aria-label={s.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── বই খুঁজুন ── */}
          <div className="footer__col">
            <h3 className="footer__heading">বই খুঁজুন</h3>
            <ul className="footer__links" role="list">
              {bookCategories.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
              <li>
                <Link to="/categories" className="footer__link footer__link--all">
                  সব বিভাগ →
                </Link>
              </li>
            </ul>
          </div>

          {/* ── সাহায্য ── */}
          <div className="footer__col">
            <h3 className="footer__heading">সাহায্য</h3>
            <ul className="footer__links" role="list">
              {helpLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── কোম্পানি ── */}
          <div className="footer__col">
            <h3 className="footer__heading">কোম্পানি</h3>
            <ul className="footer__links" role="list">
              {companyLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Divider ── */}
        <div className="footer__divider" role="separator" />

        {/* ── Bottom bar ── */}
        <div className="footer__bottom">
          <p className="footer__copy">© ২০২৪ পুস্তক। সকল অধিকার সংরক্ষিত।</p>

          <div className="footer__payments" aria-label="পেমেন্ট পদ্ধতি">
            {payments.map((p) => (
              <span key={p} className="footer__payment-badge">{p}</span>
            ))}
          </div>

          <div className="footer__legal">
            <Link to="/privacy" className="footer__legal-link">গোপনীয়তা নীতি</Link>
            <Link to="/terms"   className="footer__legal-link">শর্তাবলী</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
