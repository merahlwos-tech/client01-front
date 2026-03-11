import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'

/* ── Palette ── */
const BG_BASE    = '#6d28d9'   /* mauve doux — remplace l'ancien #1e1b4b trop foncé */
const BG_SCROLL  = '#5b21b6'
const PURPLE     = '#7c3aed'

function Navbar() {
  const { itemCount }   = useCart()
  const { t, lang, setLang, isRTL } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const NAV_LINKS = [
    { to: '/products?category=Board',        label: t('boxes') },
    { to: '/products?category=Bags',         label: t('bags') },
    { to: '/products?category=Autocollants', label: t('cards') },
    { to: '/products?category=Paper',        label: t('paper') },
    { to: '/about',                          label: t('about') },
  ]

  const fontCls = lang === 'ar' ? 'font-arabic' : ''

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${fontCls}`}
        style={{
          background: scrolled
            ? `rgba(109,40,217,0.98)`
            : `rgba(109,40,217,0.93)`,
          backdropFilter: 'blur(14px)',
          borderBottom: scrolled ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 24px rgba(30,27,75,0.18)' : 'none',
        }}
        dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/icon.jpg" alt="BrandPack" className="w-9 h-9 rounded-full object-contain" />
            <span className="font-black italic text-white text-lg leading-none hidden sm:block">
              BrandPack
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(124,58,237,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'transparent' }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions droite */}
          <div className="flex items-center gap-2">

            {/* Toggle langue */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all border"
              style={{
                color: 'rgba(255,255,255,0.85)',
                borderColor: 'rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.18)',
                fontFamily: lang === 'fr' ? "'Tajawal', sans-serif" : "'Public Sans', sans-serif",
              }}
              title={lang === 'fr' ? 'Switch to Arabic' : 'Passer en Français'}>
              {lang === 'fr' ? 'عر' : 'FR'}
            </button>

            {/* Panier */}
            <Link to="/cart" className="relative p-2 rounded-xl transition-all"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center
                                 rounded-full text-white text-[10px] font-black"
                  style={{ background: PURPLE }}>
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Burger mobile */}
            <button onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl transition-all"
              style={{ color: 'rgba(255,255,255,0.85)' }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0"
            style={{ background: 'rgba(30,27,75,0.6)', backdropFilter: 'blur(4px)' }} />
          <nav
            className={`absolute top-16 left-0 right-0 py-4 px-4 space-y-1 ${fontCls}`}
            style={{ background: BG_SCROLL, borderBottom: '1px solid rgba(124,58,237,0.2)' }}
            onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(124,58,237,0.18)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'transparent' }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}

export default Navbar