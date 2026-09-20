import { createPortal } from 'react-dom'
import './HoverTooltip.css'

// ── Fallback: person silhouette (authors) ─────────────────────────
const PersonIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="28" cy="20" r="9" fill="currentColor" opacity="0.35" />
    <path
      d="M8 50c0-11.046 8.954-20 20-20s20 8.954 20 20"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35"
    />
  </svg>
)

// ── Fallback: open-book (publications) ────────────────────────────
const BookIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="8"  y="11" width="17" height="24" rx="2" fill="currentColor" opacity="0.25" />
    <rect x="31" y="11" width="17" height="24" rx="2" fill="currentColor" opacity="0.25" />
    <line x1="28" y1="11" x2="28" y2="35" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <line x1="11" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="11" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="11" y1="26" x2="19" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="34" y1="18" x2="45" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="34" y1="22" x2="45" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <line x1="34" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <path d="M12 38 Q28 44 44 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" fill="none" />
  </svg>
)

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d])

const CARD_W = 300
const CARD_H = 100  // conservative; real height clamps itself
const GAP    = 12

/**
 * Single shared floating tooltip — rendered once via portal to <body>.
 *
 * Props (all from the single `hoveredItem` state object in the parent):
 *   visible   {boolean}
 *   kind      {'author' | 'publication'}
 *   title     {string}   — display name / publication title
 *   bio       {string|null}
 *   image     {string|null}  — photo_url / cover_image_url
 *   count     {number|null}  — book count badge
 *   x         {number}   — trigger's rect.right (viewport px)
 *   y         {number}   — trigger's rect.top   (viewport px)
 *   triggerH  {number}   — trigger's rect.height
 */
export default function HoverTooltip({ item }) {
  if (!item?.visible) return null

  const { kind, title, bio, image, count, x, y, triggerH } = item

  // ── Smart positioning ─────────────────────────────────────────
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Prefer right of trigger; flip left when near right edge
  let left      = x + GAP
  let placement = 'right'
  if (left + CARD_W > vw - 8) {
    left      = x - CARD_W - GAP * 2   // x is rect.right; rect.left ≈ x - triggerW
    placement = 'left'
  }
  left = Math.max(8, left)

  // Vertically centre on trigger row; clamp to viewport
  let top = y + triggerH / 2 - CARD_H / 2
  top = Math.max(8, Math.min(top, vh - CARD_H - 8))

  const isAuthor = kind === 'author'
  const bioText  = bio || 'No biography available.'
  const FallbackIcon = isAuthor ? PersonIcon : BookIcon

  return createPortal(
    <div
      role="tooltip"
      className={`ht__card ht__card--${placement} ht__card--visible`}
      style={{ top, left }}
      // pointer-events: none in CSS — user cannot accidentally hover it
    >
      {/* ── Image / fallback ── */}
      <div className={`ht__thumb ${isAuthor ? 'ht__thumb--circle' : 'ht__thumb--square'}`}>
        {image ? (
          <img
            src={image}
            alt={title}
            className="ht__thumb-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="ht__thumb-fallback"
          style={image ? { display: 'none' } : undefined}
        >
          <FallbackIcon />
        </div>
      </div>

      {/* ── Info ── */}
      <div className="ht__info">
        <p className="ht__title">{title}</p>
        {count != null && (
          <span className="ht__badge">{toBn(count)} টি বই</span>
        )}
        <p className="ht__bio">{bioText}</p>
      </div>

      {/* ── Caret arrow ── */}
      <div className={`ht__caret ht__caret--${placement}`} aria-hidden="true" />
    </div>,
    document.body
  )
}
