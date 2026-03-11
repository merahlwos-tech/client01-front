import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { trackPageView } from './utils/metaPixel'
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
import ServerOverloadPage from './pages/public/ServerOverloadPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage'

// Déclenche un PageView Meta à chaque changement de route
function PageViewTracker() {
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
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <PageViewTracker />
            <Toaster position="top-right"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#1e1b4b',
                  border: '1px solid rgba(124,58,237,0.15)',
                  borderRadius: '14px',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0 4px 24px rgba(124,58,237,0.12)',
                },
                success: { iconTheme: { primary: '#7c3aed', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            <Routes>
              <Route path="/"             element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/products"     element={<PublicLayout><ProductsPage /></PublicLayout>} />
              <Route path="/products/:id" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
              <Route path="/cart"         element={<PublicLayout><CartPage /></PublicLayout>} />
              <Route path="/confirmation" element={<PublicLayout><ConfirmationPage /></PublicLayout>} />
              <Route path="/about"        element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/server-error" element={<ServerOverloadPage />} />
              <Route path="/admin/login"  element={<AdminLoginPage />} />
              <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                <Route index        element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders"      element={<AdminOrdersPage />} />
                <Route path="orders/:id"  element={<AdminOrderDetailPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App