import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/http'

// Context
const AppContext = createContext(null)

// Provider
export function AppProvider({ children }) {
  // Cart (now backed by the database)
  const [cartItems, setCartItems] = useState([])   // rows from cart_item joined with books
  const [cartLoading, setCartLoading] = useState(false)

  const [cartOpen, setCartOpen]     = useState(false)
  const [wishOpen, setWishOpen]     = useState(false)
  const [previewBook, setPreviewBook] = useState(null)

  // Auth (persisted to localStorage — customer only, never admin)
  const [authUser, setAuthUserState] = useState(() => {
    try {
      const userType = localStorage.getItem('pustak-user-type')
      // If the stored session is an admin session, do NOT restore authUser.
      // Admin auth is handled separately via adminToken.
      if (userType === 'admin') return null
      const raw = localStorage.getItem('pustak-auth-user')
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })

  const setAuthUser = (user) => {
    try {
      if (user) localStorage.setItem('pustak-auth-user', JSON.stringify(user))
      else localStorage.removeItem('pustak-auth-user')
    } catch (e) {
      // ignore
    }
    setAuthUserState(user)
  }

  const signOut = () => {
    try {
      localStorage.removeItem('pustak-auth-user')
      localStorage.removeItem('pustak-auth-token')
      localStorage.removeItem('pustak-user-type')
      localStorage.removeItem('adminToken')
    } catch (e) {
      // ignore
    }
    setAuthUserState(null)
    setCartItems([])
  }

  // Database (books listing)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  const fetchBooks = async (page = 1, limit = 20) => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/books?page=${page}&limit=${limit}`)
      const json = await res.json()

      setBooks(json.data)
      setPagination({
        total: json.total,
        currentPage: json.currentPage,
        totalPages: json.totalPages
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  // -------------------- CART (backend-synced) --------------------

  const fetchCart = useCallback(async () => {
    if (!authUser) {
      setCartItems([])
      return
    }
    try {
      setCartLoading(true)
      const data = await api.get('/cart')
      setCartItems(data.items)
    } catch (err) {
      console.error(err)
    } finally {
      setCartLoading(false)
    }
  }, [authUser])

  // Load / clear cart whenever login state changes
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Add a book to the cart. Returns the created/updated cart_item.
  // Accepts an optional `qty` property on the book object (from BookDetailPage).
  const addToCart = async (book) => {
    if (!authUser) {
      throw new Error('কার্টে যোগ করতে লগইন করুন')
    }
    const quantity = (Number.isInteger(book.qty) && book.qty > 0) ? book.qty : 1
    const item = await api.post('/cart/items', { bookId: book.id, quantity })
    await fetchCart()
    setCartOpen(true)
    return item
  }

  // item = a row from cartItems (has cart_item_id + quantity)
  const incrementItem = async (item) => {
    await api.patch(`/cart/items/${item.cart_item_id}`, { quantity: item.quantity + 1 })
    await fetchCart()
  }

  const decrementItem = async (item) => {
    const nextQty = item.quantity - 1
    await api.patch(`/cart/items/${item.cart_item_id}`, { quantity: nextQty })
    await fetchCart() // if nextQty <= 0 the backend deletes the row
  }

  // Remove by cart_item_id
  const removeFromCart = async (cartItemId) => {
    await api.del(`/cart/items/${cartItemId}`)
    setCartItems((prev) => prev.filter((it) => it.cart_item_id !== cartItemId))
  }

  const isInCart = (bookId) => cartItems.some((it) => it.book_id === bookId)

  const cartTotal = cartItems.reduce(
    (sum, it) => sum + Number(it.locked_price) * it.quantity,
    0
  )
  // kept for backward compatibility with any code still reading totalCartPrice
  const totalCartPrice = cartTotal

  // Places an order from the current cart. Returns the created order row.
  const placeOrder = async (addressId, couponCode = null, deliveryCharge = 0) => {
    const order = await api.post('/orders', { addressId, couponCode, deliveryCharge })
    return order
  }

  // -------------------- WISHLIST (DB-backed, mirrors cart) --------------------

  const [wishItems, setWishItems]   = useState([])
  const [wishLoading, setWishLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!authUser) {
      setWishItems([])
      return
    }
    try {
      setWishLoading(true)
      const data = await api.get('/wishlist')
      setWishItems(data.items)
    } catch (err) {
      console.error(err)
    } finally {
      setWishLoading(false)
    }
  }, [authUser])

  // Load / clear wishlist whenever login state changes
  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Toggle: adds the book if not wishlisted, removes it if already there.
  // Works for both BookCard heart icon and AccountWishlist trash button.
  const toggleWish = async (book) => {
    if (!authUser) return   // silently ignore if not logged in
    const bookId = book.id || book.book_id
    try {
      await api.post('/wishlist/items', { bookId })
      await fetchWishlist()
    } catch (err) {
      console.error(err)
    }
  }

  // Direct remove by wishlist_item_id (used in AccountWishlist trash button)
  const removeFromWishlist = async (wishlistItemId) => {
    try {
      await api.del(`/wishlist/items/${wishlistItemId}`)
      setWishItems((prev) => prev.filter((it) => it.wishlist_item_id !== wishlistItemId))
    } catch (err) {
      console.error(err)
    }
  }

  const isWished = (bookId) => wishItems.some((it) => it.book_id === bookId)

  // Render
  return (
    <AppContext.Provider value={{
      // cart
      cartItems, cartLoading, cartTotal, totalCartPrice,
      addToCart, incrementItem, decrementItem, removeFromCart, isInCart,
      placeOrder, fetchCart,
      // wishlist
      wishItems, wishLoading, toggleWish, removeFromWishlist, isWished, fetchWishlist,
      // ui
      cartOpen, setCartOpen,
      wishOpen, setWishOpen,
      previewBook, setPreviewBook,
      // books
      books, loading, pagination, fetchBooks,
      // auth
      authUser, setAuthUser, signOut
    }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('Error')
  return ctx
}
