import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const CAT_LABELS_FR = { Board: 'Boites', Bags: 'Sacs', Autocollants: 'Cartes et Autocollants', Paper: 'Papier' }
const CAT_LABELS_AR = { Board: 'صناديق', Bags: 'أكياس', Autocollants: 'بطاقات', Paper: 'ورق' }

function ProductCard({ product }) {
  const navigate = useNavigate()
  const { t, lang, isRTL } = useLang()

  const imageUrl = product.images?.[0] || '/placeholder.jpg'
  const minPrice = product.sizes?.length ? Math.min(...product.sizes.map(s => s.price ?? 0)) : 0
  const catLabels = lang === 'ar' ? CAT_LABELS_AR : CAT_LABELS_FR
  const catLabel  = catLabels[product.category] || product.category

  const goToProduct = () => navigate(`/products/${product._id}`)

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full"
      style={{ boxShadow: '0 2px 20px rgba(124,58,237,0.10)' }}
      onClick={goToProduct}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Image ── */}
      <div className="relative w-full overflow-hidden bg-gray-50" style={{ aspectRatio: '4/3' }}>
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />

        {/* Badge catégorie */}
        <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'}`}>
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow"
            style={{ background: PURPLE }}>
            {catLabel}
          </span>
        </div>

        {/* Badge recto-verso */}
        {product.doubleSided && (
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`}>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
              style={{ background: NAVY }}>
              {lang === 'ar' ? 'وجهان' : 'Recto-verso'}
            </span>
          </div>
        )}
      </div>

      {/* ── Infos ── */}
      <div className="flex flex-col gap-3 p-4 flex-1">

        {/* Nom du produit */}
        <h3 className="font-bold text-base leading-snug line-clamp-2" style={{ color: NAVY }}>
          {product.name}
        </h3>

        {/* Prix */}
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            {t('fromPrice')}
          </span>
          <span className="font-black text-xl" style={{ color: PURPLE }}>
            {minPrice.toLocaleString('fr-DZ')}
            <span className="text-sm font-bold ml-0.5">DA</span>
          </span>
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            {t('perUnit')}
          </span>
        </div>

        {/* Bouton */}
        <button
          onClick={e => { e.stopPropagation(); goToProduct() }}
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: PURPLE }}
        >
          {t('chooseSizes')}
        </button>
      </div>
    </div>
  )
}

export default ProductCard