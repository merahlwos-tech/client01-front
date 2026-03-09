import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const CATEGORIES = [
  { label: 'Tous les produits', cat: '' },
  { label: 'Boites',            cat: 'Board' },
  { label: 'Sacs',              cat: 'Bags' },
  { label: 'Cartes',            cat: 'Autocollants' },
  { label: 'Papier',            cat: 'Paper' },
]

function Navbar() {
  const { itemCount } = useCart()
  const navigate      = useNavigate()
  const [scrolled, setScrolled]     = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (cat) => {
    cat ? navigate(`/products?category=${cat}`) : navigate('/products')
    setDrawerOpen(false)
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                       px-4 py-2 border-b border-mauve/10 transition-all duration-300
                       ${scrolled
                         ? 'bg-bg-light/95 backdrop-blur-md shadow-dark'
                         : 'bg-bg-light/90 backdrop-blur-md'}`}>

        {/* Logo image */}
        <Link to="/" className="flex items-center shrink-0">
          <img src="/logo.jpg" alt="BrandPack" className="h-10 w-10 rounded-full object-contain" />
        </Link>

        {/* Titre centré */}
        <Link to="/"
          className="text-mauve text-xl font-bold leading-tight tracking-tight flex-1
                     text-center italic hover:text-mauve-light transition-colors">
          BrandPack
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Catégories */}
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center rounded-full h-10 w-10
                       hover:bg-mauve/10 text-mauve transition-colors"
            title="Catégories">
            <Menu size={20} strokeWidth={1.5} />
          </button>

          {/* Panier */}
          <button onClick={() => navigate('/cart')}
            className="relative flex items-center justify-center rounded-full h-10 w-10
                       hover:bg-mauve/10 text-mauve transition-colors"
            title="Mon panier">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white
                               text-[10px] font-bold flex items-center justify-center
                               rounded-full shadow-dark">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-64 z-50 bg-charcoal shadow-dark
                       flex flex-col transition-transform duration-300 ease-in-out
                       ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-mauve/30">
          <span className="text-gold font-black italic text-base">Catégories</span>
          <button onClick={() => setDrawerOpen(false)}
            className="text-gold/50 hover:text-gold transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1">
          {CATEGORIES.map(({ label, cat }) => (
            <button key={label} onClick={() => goTo(cat)}
              className="w-full flex items-center justify-between px-4 py-3
                         rounded-xl text-sm font-semibold text-gold/60
                         hover:bg-mauve/20 hover:text-gold transition-all duration-200">
              {label}
              <ChevronRight size={14} className="text-gold/30" />
            </button>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-mauve/30">
          <p className="text-gold/30 text-xs text-center italic">BrandPack — Algérie</p>
        </div>
      </div>
    </>
  )
}

export default Navbar