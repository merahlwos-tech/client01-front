import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'

function ProductsPage() {
  const [searchParams]              = useSearchParams()
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)

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

  return (
    <div className="min-h-screen pt-16"
      style={{ background: 'linear-gradient(160deg, #f9f0f6 0%, #f3ecf8 40%, #ede8f5 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <ProductGrid products={filtered} loading={loading}
          emptyMessage="Aucun article dans cette catégorie." />
      </div>
    </div>
  )
}

export default ProductsPage