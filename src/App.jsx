import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { trackPageView } from './utils/pixel'
import Navbar from './Components/ui/Navbar'
import Footer from './Components/ui/Footer'
import PrivateRoute from './Components/ui/PrivateRoute'
import AdminLayout from './Components/admin/AdminLayout'
import HomePage from './pages/public/HomePage'
import ProductsPage from './pages/public/ProductsPage'
import ProductDetailPage from './pages/public/ProductDetailPage'
import CartPage from './pages/public/CartPage'
import ConfirmationPage from './pages/public/ConfirmationPage'
import AboutPage from './pages/public/AboutPage'
import TagProductsPage from './pages/public/TagProductsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'

function PageTracker() {
  const location = useLocation()
  useEffect(() => { trackPageView() }, [location.pathname])
  return null
}

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right"
            toastOptions={{
              style: {
                background: '#221610',
                color: '#ce8db1',
                border: '1px solid rgba(75,32,56,0.5)',
                borderRadius: '12px',
                fontFamily: 'Public Sans, sans-serif',
                fontSize: '14px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary: '#ec5b13', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ce8db1', secondary: '#221610' } },
            }}
          />
          <Routes>
            <Route path="/"             element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/products"     element={<PublicLayout><ProductsPage /></PublicLayout>} />
            <Route path="/products/:id" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
            <Route path="/tag/:tag"     element={<PublicLayout><TagProductsPage /></PublicLayout>} />
            <Route path="/cart"         element={<PublicLayout><CartPage /></PublicLayout>} />
            <Route path="/confirmation" element={<PublicLayout><ConfirmationPage /></PublicLayout>} />
            <Route path="/about"        element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/admin/login"  element={<AdminLoginPage />} />
            <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
              <Route index           element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders"   element={<AdminOrdersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App