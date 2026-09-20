import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './SectionHeader.css'

export default function SectionHeader({ label, title, subtitle, linkText, linkHref, align = 'left' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`section-header section-header--${align} ${visible ? 'section-header--visible' : ''}`}
      ref={ref}
    >
      <div className="section-header__top">
        {label && <span className="section-header__label">{label}</span>}
        {linkText && linkHref && (
          <Link to={linkHref} className="section-header__link">
            {linkText} <ArrowRight size={15} />
          </Link>
        )}
      </div>
      <h2 className="section-header__title">{title}</h2>
      {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
    </div>
  )
}
