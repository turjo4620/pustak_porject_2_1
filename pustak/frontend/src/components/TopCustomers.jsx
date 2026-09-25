import { useState, useEffect } from 'react'
import SectionHeader from './SectionHeader'
import './TopCustomers.css'

const MEDALS = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰']
const toBn = (n) => String(n).replace(/[0-9]/g, (d) => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d])
const formatCustomerName = (name = '') =>
  /^turjo sarker$/i.test(name.trim()) ? 'Turjo Sarkar Prince' : name

// Generate a consistent colour from a name string
function avatarColor(name = '') {
  const colors = [
    '#1e3a2f', '#2d6a4f', '#1e40af', '#5b21b6',
    '#9d174d', '#92400e', '#065f46', '#1e3a5f'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return colors[hash % colors.length]
}

export default function TopCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('https://putak-porject-2-1.onrender.com/api/public/top-customers?limit=5')
      .then(r => r.json())
      .then(data => {
        const uniqueCustomers = new Map()
        ;(Array.isArray(data) ? data : []).forEach(customer => {
          const key = String(customer.name || '').trim().toLocaleLowerCase()
          const existing = uniqueCustomers.get(key)
          if (!existing || Number(customer.total_orders) > Number(existing.total_orders)) {
            uniqueCustomers.set(key, customer)
          }
        })
        setCustomers([...uniqueCustomers.values()].slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || customers.length === 0) return null

  return (
    <section className="top-customers section-sm" aria-label="à¦¸à§‡à¦°à¦¾ à¦•à§à¦°à§‡à¦¤à¦¾">
      <div className="container">
        <SectionHeader
          label="à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¸à§‡à¦°à¦¾"
          title="à¦¶à§€à¦°à§à¦· à¦•à§à¦°à§‡à¦¤à¦¾"
          subtitle="à¦¸à¦¬à¦šà§‡à¦¯à¦¼à§‡ à¦¬à§‡à¦¶à¦¿ à¦¬à¦‡ à¦•à¦¿à¦¨à§‡à¦›à§‡à¦¨ à¦¯à¦¾à¦°à¦¾"
          align="center"
        />

        <div className="top-customers__list">
          {customers.map((c, idx) => (
            <div
              key={idx}
              className={`top-customers__card rank-card--${idx + 1}`}
              aria-label={`${idx + 1} à¦¨à¦®à§à¦¬à¦°: ${formatCustomerName(c.name)}`}
            >
              {/* Rank badge */}
              <div className="top-customers__rank">
                {idx < 3 ? MEDALS[idx] : `#${idx + 1}`}
              </div>

              {/* Avatar */}
              <div
                className="top-customers__avatar"
                style={{ background: avatarColor(c.name) }}
                aria-hidden="true"
              >
                {formatCustomerName(c.name || '?').charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="top-customers__info">
                <p
                  className="top-customers__name"
                  title={formatCustomerName(c.name)}
                >
                  {formatCustomerName(c.name)}
                </p>
                <p className="top-customers__orders">
                  {toBn(c.total_orders)} à¦Ÿà¦¿ à¦…à¦°à§à¦¡à¦¾à¦°
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

