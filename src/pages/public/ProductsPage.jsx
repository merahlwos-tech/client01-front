import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const CATEGORIES = [
  { value: 'Tous',         label: 'Tous',   emoji: '🛍️' },
  { value: 'Board',        label: 'Boites', emoji: '📦' },
  { value: 'Bags',         label: 'Sacs',   emoji: '🛍️' },
  { value: 'Autocollants', label: 'Cartes', emoji: '🎴' },
  { value: 'Paper',        label: 'Papier', emoji: '📄' },
]

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const activeCategory = searchParams.get('category') || 'Tous'

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => products.filter(p => {
    const matchCat    = activeCategory === 'Tous' || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [products, activeCategory, search])

  const setCategory = cat => {
    if (cat === 'Tous') searchParams.delete('category')
    else searchParams.set('category', cat)
    setSearchParams(searchParams)
  }

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}>

      {/* Barre sticky */}
      <div className="sticky top-0 z-40 pt-16 backdrop-blur-md"
        style={{ background: 'rgba(245,243,255,0.95)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                           transition-all duration-200 whitespace-nowrap"
                style={{
                  background: activeCategory === cat.value ? PURPLE : 'white',
                  color:      activeCategory === cat.value ? 'white' : NAVY,
                  border:     `2px solid ${activeCategory === cat.value ? PURPLE : 'rgba(124,58,237,0.15)'}`,
                }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="bg-white rounded-full text-sm pl-8 pr-8 py-2 outline-none w-36"
              style={{ border: '2px solid rgba(124,58,237,0.15)' }} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!loading && (
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
        <ProductGrid products={filtered} loading={loading}
          emptyMessage="Aucun produit dans cette catégorie." />
      </div>
    </div>
  )
}

export default ProductsPage