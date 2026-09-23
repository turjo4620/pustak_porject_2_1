import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import './styles/App.css'

import { AppProvider } from './context/AppContext'
import Navigation from './components/Navigation'
import Footer from './components/Footer'

import HomePage        from './pages/HomePage'
import BookDetailPage  from './pages/BookDetailPage'
import SearchPage      from './pages/SearchPage'
import CategoryPage    from './pages/CategoryPage'
import CategoriesPage  from './pages/CategoriesPage'
import BestSellersPage from './pages/BestSellersPage'
import NewArrivalsPage from './pages/NewArrivalsPage'
import OffersPage      from './pages/OffersPage'
import AuthorsPage     from './pages/AuthorsPage'
import AuthorPage      from './pages/AuthorPage'
import PublicationPage from './pages/PublicationPage'
import PublishersPage  from './pages/PublishersPage'
import CheckoutPage    from './pages/CheckoutPage'
import CartPage        from './pages/CartPage'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import NotFoundPage    from './pages/NotFoundPage'

// Import the Account Dashboard components
import AccountDashboardLayout from './pages/AccountDashboardLayout.jsx'
import AccountProfileCard     from './pages/AccountProfileCard'
import AccountOrders          from './pages/AccountOrders'
import AccountWishlist        from './pages/AccountWishlist'
import AccountReviews         from './pages/AccountReviews'
import AccountReturns         from './pages/AccountReturns'
import OrderDinPage           from './pages/OrderDinPage'
import AccountHomePage        from './pages/AccountHomePage'
import PaymentPage            from './pages/PaymentPage'
import OrderSuccessPage       from './pages/OrderSuccessPage'
import OrderDetailPage        from './pages/OrderDetailPage'

// Import Admin components
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminBooks from './pages/admin/AdminBooks.jsx'
import AdminAuthors from './pages/admin/AdminAuthors.jsx'
import AdminPublications from './pages/admin/AdminPublications.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminOrders      from './pages/admin/AdminOrders.jsx'
import AdminReturns     from './pages/admin/AdminReturns.jsx'
import AdminReviews     from './pages/admin/AdminReviews.jsx'
import AdminAnalytics   from './pages/admin/AdminAnalytics.jsx'
import AdminCoupons     from './pages/admin/AdminCoupons.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])
  return null
}

// Redirect admin sessions away from customer routes to /login
function CustomerGuard({ children }) {
  const location = useLocation()
  const userType   = localStorage.getItem('pustak-user-type')
  const adminToken = localStorage.getItem('adminToken')
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isAuthRoute  = location.pathname === '/login' || location.pathname === '/register'

  if (!isAdminRoute && !isAuthRoute && userType === 'admin' && adminToken) {
    // Push /login onto history so the browser back button works normally
    return <Navigate to="/login" />
  }
  return children
}

function Layout({ children, isDarkMode, toggleDarkMode }) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="app">
      {!isAdminRoute && <Navigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
    </div>
  )
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : '')
  }, [isDarkMode])

  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Layout isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}>
          <CustomerGuard>
          <Routes>
            <Route path="/"                  element={<HomePage />} />
            <Route path="/book/:id"          element={<BookDetailPage />} />
            <Route path="/search"            element={<SearchPage />} />
            <Route path="/categories"        element={<CategoriesPage />} />
            <Route path="/category/:id"      element={<CategoryPage />} />
            <Route path="/bestsellers"       element={<BestSellersPage />} />
            <Route path="/new-arrivals"      element={<NewArrivalsPage />} />
            <Route path="/offers"            element={<OffersPage />} />
            <Route path="/authors"           element={<AuthorsPage />} />
            {/* 
              Swapped :name for :id below! 
              Now React Router knows to pass the ID number to AuthorPage.jsx 
            */}
            <Route path="/author/:id"        element={<AuthorPage />} />
            <Route path="/publishers"        element={<PublishersPage />} />
            <Route path="/publisher/:id"    element={<PublicationPage />} />
            <Route path="/cart"              element={<CartPage />} />
            <Route path="/checkout"          element={<CheckoutPage />} />
            <Route path="/payment/:orderId"  element={<PaymentPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/login"             element={<LoginPage />} />
            <Route path="/register"          element={<RegisterPage />} />
            
            {/* --- NEW NESTED ACCOUNT ROUTES --- */}
            <Route path="/account" element={<AccountDashboardLayout />}>
              <Route index element={<AccountHomePage />} />
              <Route path="profile" element={<AccountProfileCard />} />
              <Route path="info" element={<AccountProfileCard />} />
              <Route path="order" element={<AccountHomePage />} />
              <Route path="orders" element={<AccountOrders />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="wishlist" element={<AccountWishlist />} />
              <Route path="returns" element={<AccountReturns />} />
              <Route path="reviews" element={<AccountReviews />} />
            </Route>

            {/* --- ADMIN ROUTES --- */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="books" element={<AdminBooks />} />
              <Route path="authors" element={<AdminAuthors />} />
              <Route path="publications" element={<AdminPublications />} />
              <Route path="categories"   element={<AdminCategories />} />
              <Route path="coupons"      element={<AdminCoupons />} />
              <Route path="users"        element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="returns" element={<AdminReturns />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            <Route path="/orders"            element={<LoginPage />} />
            <Route path="/settings"          element={<LoginPage />} />
            <Route path="*"                  element={<NotFoundPage />} />
          </Routes>
          </CustomerGuard>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  )
}