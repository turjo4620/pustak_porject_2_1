import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Package, RotateCcw, Truck, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import './HelpPage.css'

// ── Accordion item ────────────────────────────────────────────────────────────
function Faq({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`help-faq ${open ? 'help-faq--open' : ''}`}>
      <button className="help-faq__q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="help-faq__a">{a}</div>}
    </div>
  )
}

// ── Sections data ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'delivery',
    icon: Truck,
    title: 'ডেলিভারি তথ্য',
    faqs: [
      {
        q: 'ডেলিভারি কতদিনে পাওয়া যাবে?',
        a: 'ঢাকার মধ্যে সাধারণত ২–৩ কার্যদিবস। ঢাকার বাইরে ৩–৫ কার্যদিবস।',
      },
      {
        q: 'ডেলিভারি চার্জ কত?',
        a: 'ঢাকা বিভাগের মধ্যে ৭০ টাকা। ঢাকার বাইরে সারা বাংলাদেশে ১২০ টাকা।',
      },
      {
        q: 'কোন কুরিয়ারে ডেলিভারি দেওয়া হয়?',
        a: 'পুস্তক নিজস্ব ও পার্টনার কুরিয়ার সার্ভিসের মাধ্যমে ডেলিভারি দেয়। অর্ডার নিশ্চিত হওয়ার পর ট্র্যাকিং নম্বর পাওয়া যাবে।',
      },
    ],
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'রিটার্ন নীতি',
    faqs: [
      {
        q: 'কোন পরিস্থিতিতে বই রিটার্ন করা যাবে?',
        a: 'বই ক্ষতিগ্রস্ত, পাতা ছেঁড়া, ভুল বই ডেলিভারি হলে বা প্রিন্টিং ত্রুটি থাকলে রিটার্ন করা যাবে।',
      },
      {
        q: 'রিটার্নের সময়সীমা কত?',
        a: 'ডেলিভারির ৭ দিনের মধ্যে রিটার্ন রিকোয়েস্ট করতে হবে।',
      },
      {
        q: 'রিটার্ন কীভাবে করব?',
        a: <>আপনার <Link to="/account/orders">অর্ডার ইতিহাস</Link> থেকে সংশ্লিষ্ট অর্ডারে গিয়ে "রিটার্ন করুন" বোতামে ক্লিক করুন এবং কারণ উল্লেখ করুন। আমরা ২৪ ঘণ্টার মধ্যে যোগাযোগ করব।</>,
      },
      {
        q: 'রিফান্ড কতদিনে পাওয়া যাবে?',
        a: 'রিটার্ন অনুমোদনের পর ৫–৭ কার্যদিবসের মধ্যে মূল পেমেন্ট পদ্ধতিতে রিফান্ড করা হবে।',
      },
    ],
  },
  {
    id: 'tracking',
    icon: Package,
    title: 'অর্ডার ট্র্যাক',
    faqs: [
      {
        q: 'অর্ডার ট্র্যাক কীভাবে করব?',
        a: <>লগইন করে <Link to="/account/orders">অর্ডার ও ট্র্যাকিং</Link> পেজে যান। সেখানে প্রতিটি অর্ডারের বর্তমান অবস্থা ও ডেলিভারি তথ্য দেখা যাবে।</>,
      },
      {
        q: 'অর্ডার নম্বর কোথায় পাব?',
        a: 'অর্ডার সম্পন্ন হওয়ার পর সাকসেস পেজে এবং অ্যাকাউন্টের অর্ডার ইতিহাসে অর্ডার নম্বর দেখা যাবে।',
      },
      {
        q: 'পেমেন্ট করার পরেও অর্ডার "Pending" দেখাচ্ছে কেন?',
        a: 'পেমেন্ট যাচাই সম্পন্ন হতে কিছু সময় লাগতে পারে। ৩০ মিনিটের বেশি "Pending" থাকলে আমাদের সাথে যোগাযোগ করুন।',
      },
    ],
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'প্রশ্ন ও উত্তর',
    faqs: [
      {
        q: 'অ্যাকাউন্ট ছাড়া অর্ডার দেওয়া যাবে?',
        a: 'না, অর্ডার দিতে একটি অ্যাকাউন্ট তৈরি করতে হবে। নিবন্ধন সম্পূর্ণ বিনামূল্যে।',
      },
      {
        q: 'কোন পেমেন্ট পদ্ধতি গ্রহণযোগ্য?',
        a: 'Visa, MasterCard, bKash, Nagad, এবং DBBL নেক্সাস কার্ড গ্রহণ করা হয়। ক্যাশ অন ডেলিভারিও পাওয়া যায়।',
      },
      {
        q: 'বই স্টকে না থাকলে কী করব?',
        a: 'বইয়ের পেজে "স্টক নেই" দেখালে উইশলিস্টে যোগ করুন। স্টক ফিরে এলে আমরা আপনাকে জানাব।',
      },
      {
        q: 'একই অর্ডারে কি একাধিক বই দেওয়া যাবে?',
        a: 'হ্যাঁ, কার্টে একাধিক বই যোগ করে একটি অর্ডারে দেওয়া যাবে।',
      },
      {
        q: 'যোগাযোগ করব কীভাবে?',
        a: 'ইমেইল: support@pustak.com.bd | ফোন: ০১৭০০-০০০০০০ | সময়: সকাল ৯টা – রাত ৯টা (শনি–বৃহঃ)',
      },
    ],
  },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const { hash } = useLocation()

  // Scroll to the anchor when the page loads or hash changes
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [hash])

  return (
    <div className="help-page">
      <div className="container">

        {/* Breadcrumb */}
        <p className="help-page__breadcrumb">
          <Link to="/">হোম</Link> › সাহায্য
        </p>

        <h1 className="help-page__title">সাহায্য কেন্দ্র</h1>
        <p className="help-page__sub">
          নিচে সব সাধারণ প্রশ্নের উত্তর পাবেন। সমস্যা না সমাধান হলে আমাদের সাথে যোগাযোগ করুন।
        </p>

        {/* Quick nav */}
        <div className="help-nav">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="help-nav__item">
              <s.icon size={18} />
              {s.title}
            </a>
          ))}
        </div>

        {/* Sections */}
        {SECTIONS.map(s => (
          <section key={s.id} id={s.id} className="help-section">
            <div className="help-section__header">
              <s.icon size={20} className="help-section__icon" />
              <h2 className="help-section__title">{s.title}</h2>
            </div>
            <div className="help-section__faqs">
              {s.faqs.map((faq, i) => (
                <Faq key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </section>
        ))}

      </div>
    </div>
  )
}
