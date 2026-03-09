import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'

const CATEGORIES = [
  { label: 'Tous',         cat: '' },
  { label: 'Board',        cat: 'Board' },
  { label: 'Bags',         cat: 'Bags' },
  { label: 'Autocollants', cat: 'Autocollants' },
  { label: 'Paper',        cat: 'Paper' },
]

function ProductsPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeCategory = searchParams.get('category') || ''

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() =>
    products.filter((p) => !activeCategory || p.category === activeCategory)
  , [products, activeCategory])

  const goTo = (cat) => {
    cat ? navigate(`/products?category=${cat}`) : navigate('/products')
    setDrawerOpen(false)
  }

  return (
    <div className="min-h-screen pt-16"
      style={{ background: 'linear-gradient(160deg, #f9f0f6 0%, #f3ecf8 40%, #ede8f5 100%)' }}>

      {/* ── Bouton catégories flottant ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-2
                   bg-mauve text-gold font-bold text-xs px-4 py-2.5
                   rounded-full shadow-fairy hover:bg-mauve-light transition-all">
        <SlidersHorizontal size={14} />
        Catégories
      </button>

      {/* ── Overlay ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Drawer ── */}
      <div className={`fixed top-0 right-0 h-full w-72 z-50 bg-charcoal shadow-dark
                       flex flex-col transition-transform duration-300 ease-in-out
                       ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-mauve/30">
          <span className="text-gold font-black italic text-lg">Collections</span>
          <button onClick={() => setDrawerOpen(false)}
            className="text-gold/60 hover:text-gold transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Catégories */}
        <div className="flex-1 px-4 py-6 space-y-2">
          {CATEGORIES.map(({ label, cat }) => {
            const active = activeCategory === cat
            return (
              <button key={label} onClick={() => goTo(cat)}
                className={`w-full flex items-center justify-between px-5 py-4
                             rounded-xl font-bold text-sm transition-all duration-200
                             ${active
                               ? 'bg-mauve text-gold shadow-fairy'
                               : 'text-gold/60 hover:bg-mauve/20 hover:text-gold'}`}>
                {label}
                <ChevronRight size={16} className={active ? 'text-gold' : 'text-gold/30'} />
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-mauve/30">
          <p className="text-gold/30 text-xs text-center italic">BrandPack — Algérie</p>
        </div>
      </div>

      {/* ── Grille produits ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <ProductGrid products={filtered} loading={loading}
          emptyMessage="Aucun article dans cette catégorie." />
      </div>

    </div>
  )
}

export default ProductsPage