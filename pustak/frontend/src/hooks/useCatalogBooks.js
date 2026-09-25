import { useEffect, useMemo, useRef, useState } from 'react'

const BASE = 'https://putak-porject-2-1.onrender.com/api'

const EMPTY_FACETS = { categories: [], authors: [], publishers: [] }

export default function useCatalogBooks(params) {
  const {
    scope, q, authorId, categoryId, publisherId,
    authorIds = [], categoryIds = [], publisherIds = [],
    priceMin = null, priceMax = null,
    inStock = false, sort = null, page = 1, limit = 20, minPct = 1,
  } = params

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (scope) p.set('scope', scope)
    if (q) p.set('q', q)
    if (authorId) p.set('author_id', authorId)
    if (categoryId) p.set('category_id', categoryId)
    if (publisherId) p.set('publisher_id', publisherId)
    if (authorIds.length) p.set('author_ids', authorIds.join(','))
    if (categoryIds.length) p.set('category_ids', categoryIds.join(','))
    if (publisherIds.length) p.set('publisher_ids', publisherIds.join(','))
    if (priceMin != null) p.set('price_min', priceMin)
    if (priceMax != null) p.set('price_max', priceMax)
    if (inStock) p.set('in_stock', 'true')
    if (sort) p.set('sort', sort)
    if (minPct && minPct !== 1) p.set('min_pct', minPct)
    p.set('page', page)
    p.set('limit', limit)
    return p.toString()
  }, [scope, q, authorId, categoryId, publisherId,
      authorIds.join(','), categoryIds.join(','), publisherIds.join(','),
      priceMin, priceMax, inStock, sort, minPct, page, limit])

  // Filter signature without page — used to decide debounce vs immediate fetch
  const filterSig = useMemo(
    () => query.replace(/(^|&)page=\d+/, ''),
    [query]
  )

  const [state, setState] = useState({
    books: [], total: 0, totalPages: 1,
    facets: EMPTY_FACETS, priceBounds: { min: 0, max: 2000 },
    loading: true, error: '',
  })

  const seqRef = useRef(0)
  const sigRef = useRef(null)

  useEffect(() => {
    const seq = ++seqRef.current
    const immediate = sigRef.current === filterSig
    sigRef.current = filterSig
    const controller = new AbortController()

    const run = () => {
      setState((s) => ({ ...s, loading: true }))
      fetch(`${BASE}/books/catalog?${query}`, { signal: controller.signal })
        .then((r) => { if (!r.ok) throw new Error('catalog request failed'); return r.json() })
        .then((json) => {
          if (seq !== seqRef.current) return
          setState({
            books: json.data || [],
            total: json.total || 0,
            totalPages: json.totalPages || 1,
            facets: json.facets || EMPTY_FACETS,
            priceBounds: json.priceRange || { min: 0, max: 2000 },
            loading: false,
            error: '',
          })
        })
        .catch((err) => {
          if (err.name === 'AbortError' || seq !== seqRef.current) return
          setState((s) => ({ ...s, loading: false, error: 'বই লোড করা যায়নি' }))
        })
    }

    // Filter changes are debounced; page changes fire immediately
    const timer = immediate ? null : setTimeout(run, 250)
    if (immediate) run()

    return () => {
      if (timer) clearTimeout(timer)
      controller.abort()
    }
  }, [query, filterSig])

  return state
}
