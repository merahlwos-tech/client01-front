import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, lazy, Suspense } from 'react'
import { CartProvider }     from './context/CartContext'
import { AuthProvider }     from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { trackPageView }    from './utils/metaPixel'
import Navbar        from './Components/ui/Navbar'
import Footer        from './Components/ui/Footer'
import PrivateRoute  from './Components/ui/PrivateRoute'
import AdminLayout   from './Components/admin/AdminLayout'

// ── Lazy loading de toutes les pages ──────────────────────────────────────
// Chaque page devient un chunk séparé chargé uniquement quand on y navigue.
// Résultat : bundle initial ~3× plus léger, First Contentful Paint plus rapide.
const HomePage          = lazy(() => import('./pages/public/HomePage'))
const ProductsPage      = lazy(() => import('./pages/public/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'))
const CartPage          = lazy(() => import('./pages/public/CartPage'))
const ConfirmationPage  = lazy(() => import('./pages/public/ConfirmationPage'))
const AboutPage         = lazy(() => import('./pages/public/AboutPage'))
const ServerOverloadPage= lazy(() => import('./pages/public/ServerOverloadPage'))
const AdminLoginPage    = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage= lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'))
const AdminOrdersPage   = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'))

// ── Spinner minimal pendant le chargement d'un chunk ─────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#f5f3ff,#ede9fe,#e0e7ff)' }}>
      <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
    </div>
  )
}

// ── PageView Meta à chaque changement de route ────────────────────────────
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
            <Suspense fallback={<PageLoader />}>
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
                  <Route index              element={<AdminDashboardPage />} />
                  <Route path="products"    element={<AdminProductsPage />} />
                  <Route path="orders"      element={<AdminOrdersPage />} />
                  <Route path="orders/:id"  element={<AdminOrderDetailPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App