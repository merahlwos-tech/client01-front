import { Link } from 'react-router-dom'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const CAT_LABELS = { Board: 'Boites', Bags: 'Sacs', Autocollants: 'Cartes', Paper: 'Papier' }

function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || '/placeholder.jpg'
  const minPrice = product.sizes?.length ? Math.min(...product.sizes.map(s => s.price ?? 0)) : 0
  const catLabel = CAT_LABELS[product.category] || product.category

  return (
    <Link to={`/products/${product._id}`} className="block group">
      <div className="rounded-2xl overflow-hidden bg-white transition-all duration-300
                      hover:-translate-y-1 w-full"
        style={{ boxShadow: '0 2px 16px rgba(124,58,237,0.08)' }}>

        {/* Image pleine largeur — 16/9 sur mobile, 4/3 sur desktop */}
        <div className="relative w-full overflow-hidden bg-gray-50"
          style={{ aspectRatio: '16/9' }}>
          <img src={imageUrl} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy" />

          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow"
              style={{ background: PURPLE }}>
              {catLabel}
            </span>
          </div>
          {product.doubleSided && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
                style={{ background: NAVY }}>
                Recto-verso
              </span>
            </div>
          )}

          {/* Prix en overlay bas sur mobile */}
          <div className="absolute bottom-0 left-0 right-0 sm:hidden px-4 py-3"
            style={{ background: 'linear-gradient(to top, rgba(30,27,75,0.75), transparent)' }}>
            <p className="text-white font-black text-lg">
              {minPrice.toLocaleString('fr-DZ')}
              <span className="text-xs font-normal opacity-80 ml-1">DA</span>
            </p>
          </div>
        </div>

        {/* Infos */}
        <div className="p-4">
          <h3 className="font-bold text-sm leading-snug mb-2 truncate" style={{ color: NAVY }}>
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="font-black text-base hidden sm:block" style={{ color: PURPLE }}>
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