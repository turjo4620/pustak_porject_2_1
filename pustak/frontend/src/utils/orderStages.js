/**
 * orderStages.js
 *
 * Single source of truth for the 5-step order lifecycle.
 * Imported by both OrderDetailPage and the TrackingModal in AccountOrders
 * so the labels, ordering, and active-step logic are always identical.
 */

// ── 5 canonical stages ────────────────────────────────────────────────────
export const ORDER_STAGES = [
  {
    key:   'placed',
    label: 'অর্ডার গৃহীত',
    // Backend statuses that count as "this stage reached or passed"
    reachedBy: ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered'],
  },
  {
    key:   'confirmed',
    label: 'অর্ডার নিশ্চিত',
    reachedBy: ['confirmed', 'paid', 'processing', 'shipped', 'delivered'],
  },
  {
    key:   'packed',
    label: 'প্যাকেজিং সম্পন্ন',
    reachedBy: ['processing', 'shipped', 'delivered'],
  },
  {
    key:   'shipped',
    label: 'পথে আছে',
    reachedBy: ['shipped', 'delivered'],
  },
  {
    key:   'delivered',
    label: 'ডেলিভার্ড',
    reachedBy: ['delivered'],
  },
]

/**
 * Returns the 0-based index of the *current* active stage for a given
 * backend status string (case-insensitive).
 *
 * "Active" = the last stage whose reachedBy list includes the status.
 * If the status is unrecognised or 'cancelled', returns -1.
 *
 * Examples:
 *   statusIndex('pending')    → 0   (placed)
 *   statusIndex('Confirmed')  → 1   (confirmed)
 *   statusIndex('Processing') → 2   (packed)
 *   statusIndex('Shipped')    → 3   (shipped)
 *   statusIndex('Delivered')  → 4   (delivered)
 *   statusIndex('Cancelled')  → -1
 */
export function statusIndex(status) {
  if (!status) return -1
  const s = status.toLowerCase()
  if (s === 'cancelled') return -1

  // Walk backward — the last stage that includes s is the active one
  for (let i = ORDER_STAGES.length - 1; i >= 0; i--) {
    if (ORDER_STAGES[i].reachedBy.includes(s)) return i
  }
  return -1
}

/**
 * Convenience: true if the stage at `stageIndex` is "done"
 * (current status has reached or passed that stage).
 */
export function isStageDone(stageIndex, status) {
  return statusIndex(status) >= stageIndex
}
