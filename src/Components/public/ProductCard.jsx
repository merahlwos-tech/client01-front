import { Link } from 'react-router-dom'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || '/placeholder.jpg'
  const minPrice = product.sizes?.length
    ? Math.min(...product.sizes.map(s => s.price ?? 0))
    : 0

  return (
    <Link to={`/products/${product._id}`} className="block group">
      <div className="rounded-2xl overflow-hidden bg-white transition-all duration-300
                      hover:-translate-y-1"
        style={{ boxShadow: '0 2px 12px rgba(124,58,237,0.1)' }}>

        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <img src={imageUrl} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy" />
          {/* Badge catégorie */}
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow"
              style={{ background: PURPLE }}>
              {product.category}
            </span>
          </div>
          {/* Badge double impression */}
          {product.doubleSided && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white shadow"
                style={{ background: NAVY }}>
                Recto-verso
              </span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-4">
          <h3 className="font-bold text-sm leading-snug mb-2 truncate transition-colors group-hover:opacity-80"
            style={{ color: NAVY }}>
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="font-black text-base" style={{ color: PURPLE }}>
              {minPrice.toLocaleString('fr-DZ')}
              <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
            </p>
            {product.sizes?.length > 1 && (
              <span className="text-xs text-gray-400">
                {product.sizes.length} tailles
              </span>
            )}
          </div>
          {/* Couleurs */}
          {product.colors?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.colors.slice(0, 4).map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(124,58,237,0.08)', color: PURPLE }}>
                  {c}
                </span>
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-gray-400">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard