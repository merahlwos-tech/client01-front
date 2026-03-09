import ProductCard from './ProductCard.jsx'

const PURPLE = '#7c3aed'

function ProductGrid({ products, loading, emptyMessage = 'Aucun article trouvé.' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="w-full bg-gray-100" style={{ aspectRatio: '16/9' }} />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded-full w-3/4" />
              <div className="h-4 bg-gray-100 rounded-full w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-3xl"
          style={{ background: 'rgba(124,58,237,0.08)' }}>
          📦
        </div>
        <p className="font-bold text-xl text-gray-400 mb-1">Aucun produit</p>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {products.map((product, i) => (
        <div key={product._id}
          style={{ animationDelay: `${i * 50}ms` }}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}

export default ProductGrid