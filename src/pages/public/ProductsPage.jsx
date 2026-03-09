import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'

function ProductsPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  const activeCategory = searchParams.get('category') || ''

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => products.filter((p) => {
    const matchCat    = !activeCategory || p.category === activeCategory
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [products, activeCategory, search])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f0f5 0%, #f5eef8 50%, #f0eaf8 100%)' }}>

      {/* ── En-tête ── */}
      <div className="pt-28 pb-10 px-6 text-center">
        <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">
          Notre boutique
        </span>
        <h1 className="text-mauve text-4xl md:text-5xl font-black italic mb-3">
          {activeCategory || 'Tous les articles'}
        </h1>
        <p className="text-text-soft text-sm">
          {loading ? '...' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── Barre de recherche uniquement ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-mauve/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-end">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/50" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="bg-mauve/5 border border-mauve/20 rounded-full text-text-main
                         text-xs pl-8 pr-8 py-2 outline-none focus:border-mauve
                         placeholder:text-text-muted w-48 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-mauve">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grille produits ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <ProductGrid products={filtered} loading={loading}
          emptyMessage="Aucun article dans cette catégorie." />
      </div>
    </div>
  )
}

export default ProductsPage