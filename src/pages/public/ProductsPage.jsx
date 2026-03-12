import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'
import { useSEO } from '../../utils/useSEO'

const CAT_TITLES = {
  Board:        'Boites d\'emballage personnalisées',
  Bags:         'Sacs personnalisés',
  Autocollants: 'Cartes et autocollants personnalisés',
  Paper:        'Papier d\'emballage personnalisé',
  Tous:         'Tous nos produits',
}
const CAT_DESCS = {
  Board:        'Boites d\'emballage sur mesure pour votre business — impression couleur, recto-verso, livraison dans les 58 wilayas.',
  Bags:         'Sacs personnalisés avec votre logo — kraft, plastique, tissu. Commande à partir de 100 unités.',
  Autocollants: 'Cartes de visite et autocollants personnalisés — impression HD, finitions mat ou brillant.',
  Paper:        'Papier d\'emballage personnalisé pour boutiques et e-commerce algérien.',
  Tous:         'Tous les emballages personnalisés BrandPack — boites, sacs, cartes, papier. Livraison Algérie.',
}

function ProductsPage() {
  const [searchParams]          = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const activeCategory = searchParams.get('category') || 'Tous'

  useSEO({
    title:       CAT_TITLES[activeCategory] || 'Nos produits',
    description: CAT_DESCS[activeCategory]  || CAT_DESCS.Tous,
  })

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => products.filter(p =>
    activeCategory === 'Tous' || p.category === activeCategory
  ), [products, activeCategory])

  return (
    <div className="min-h-screen pt-20"
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ProductGrid products={filtered} loading={loading}
          emptyMessage="Aucun produit dans cette catégorie." />
      </div>
    </div>
  )
}

export default ProductsPage