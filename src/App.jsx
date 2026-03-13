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

const WA_NUMBER = '213554767444'

function WhatsAppButton() {
  const location = useLocation()
  const isAdmin  = location.pathname.startsWith('/admin')
  if (isAdmin) return null
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter sur WhatsApp"
      className="fixed bottom-5 left-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.45)' }}>
      <svg viewBox="0 0 32 32" width="30" height="30" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.003 2C8.28 2 2 8.28 2 16c0 2.47.65 4.79 1.78 6.8L2 30l7.38-1.75A14 14 0 0 0 16.003 30C23.72 30 30 23.72 30 16S23.72 2 16.003 2zm0 2.5A11.5 11.5 0 0 1 27.5 16c0 6.35-5.15 11.5-11.497 11.5a11.47 11.47 0 0 1-5.88-1.62l-.42-.25-4.38 1.04 1.07-4.25-.27-.43A11.47 11.47 0 0 1 4.5 16 11.5 11.5 0 0 1 16.003 4.5zm-3.19 5.36c-.27-.62-.55-.63-.81-.64l-.69-.01c-.24 0-.62.09-.95.44s-1.24 1.21-1.24 2.95 1.27 3.42 1.45 3.66c.18.24 2.46 3.9 6.06 5.3 3 1.18 3.6.94 4.25.88.65-.06 2.1-.86 2.4-1.69.3-.83.3-1.54.21-1.69-.09-.15-.33-.24-.69-.42s-2.1-1.04-2.43-1.16c-.33-.12-.57-.18-.81.18s-.93 1.16-1.14 1.4c-.21.24-.42.27-.78.09s-1.52-.56-2.9-1.79c-1.07-.95-1.8-2.13-2.01-2.49s-.02-.55.16-.73c.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.79-1.95-1.1-2.67z"/>
      </svg>
    </a>
  )
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
              <WhatsAppButton />
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