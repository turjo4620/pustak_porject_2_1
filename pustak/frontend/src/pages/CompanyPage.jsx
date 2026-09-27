import { Link, useParams } from 'react-router-dom'
import './CompanyPage.css'

const PAGES = {
  about: {
    title: 'আমাদের সম্পর্কে',
    intro: 'পুস্তক বাংলাদেশের পাঠকদের জন্য একটি সহজ, নির্ভরযোগ্য ও আনন্দদায়ক অনলাইন বইয়ের দোকান।',
    sections: [
      ['আমাদের লক্ষ্য', 'পাঠকের হাতে প্রিয় বই পৌঁছে দেওয়া এবং বাংলা ও বিশ্বসাহিত্যের সঙ্গে আরও বেশি মানুষকে যুক্ত করাই আমাদের লক্ষ্য।'],
      ['আমরা কী করি', 'বিভিন্ন বিষয় ও প্রকাশকের বই এক জায়গায় খুঁজে পাওয়া, নিরাপদে অর্ডার করা এবং দ্রুত ডেলিভারি পাওয়ার সুযোগ দিই।'],
    ],
  },
  blog: {
    title: 'ব্লগ',
    intro: 'বই, পাঠাভ্যাস, লেখক ও সাহিত্যের নানা বিষয় নিয়ে পুস্তকের লেখা শিগগিরই প্রকাশিত হবে।',
    sections: [
      ['কী থাকছে', 'নতুন বইয়ের পরিচিতি, পাঠকের জন্য বইয়ের সুপারিশ, লেখক পরিচিতি এবং বই নিয়ে নানা আলোচনা।'],
      ['সঙ্গে থাকুন', 'নতুন লেখা প্রকাশিত হলে এই পেজেই তা দেখতে পাবেন। আমাদের সামাজিক যোগাযোগমাধ্যমেও চোখ রাখুন।'],
    ],
  },
  careers: {
    title: 'চাকরি',
    intro: 'পাঠকের জন্য আরও ভালো বইয়ের অভিজ্ঞতা তৈরি করতে আমরা আগ্রহী ও সৃজনশীল মানুষদের খুঁজছি।',
    sections: [
      ['আমাদের সঙ্গে কাজ করুন', 'কনটেন্ট, কাস্টমার সাপোর্ট, প্রযুক্তি ও অপারেশনস—বিভিন্ন ক্ষেত্রে সুযোগ তৈরি হলে এখানে জানানো হবে।'],
      ['আবেদন', 'আপনার সিভি ও আগ্রহের ক্ষেত্র careers@pustak.com.bd ঠিকানায় পাঠান। উপযুক্ত সুযোগ এলে আমরা যোগাযোগ করব।'],
    ],
  },
  contact: {
    title: 'যোগাযোগ',
    intro: 'আপনার প্রশ্ন, মতামত বা সহযোগিতার প্রয়োজন হলে আমরা সাহায্য করতে প্রস্তুত।',
    sections: [
      ['সাপোর্ট', 'ইমেইল: support@pustak.com.bd\nফোন: ০১৭০০-০০০০০০'],
      ['সেবার সময়', 'প্রতিদিন সকাল ৯টা থেকে রাত ৯টা পর্যন্ত আমাদের সাপোর্ট টিমের সঙ্গে যোগাযোগ করা যাবে।'],
    ],
  },
}

export default function CompanyPage() {
  const { page } = useParams()
  const content = PAGES[page] || PAGES.about

  return (
    <div className="company-page">
      <div className="container">
        <p className="company-page__breadcrumb">
          <Link to="/">হোম</Link> › {content.title}
        </p>
        <article className="company-page__card">
          <span className="company-page__label">পুস্তক</span>
          <h1 className="company-page__title">{content.title}</h1>
          <p className="company-page__intro">{content.intro}</p>
          <div className="company-page__sections">
            {content.sections.map(([heading, text]) => (
              <section key={heading} className="company-page__section">
                <h2>{heading}</h2>
                <p>{text}</p>
              </section>
            ))}
          </div>
          <Link to="/help" className="company-page__action">সাহায্য কেন্দ্রে যান</Link>
        </article>
      </div>
    </div>
  )
}
