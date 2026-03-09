import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'
import SizeSelector from '../../Components/public/SizeSelector'
import QuantitySelector from '../../Components/public/QuantitySelector'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function ProductDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [selectedSize, setSelectedSize] = useState(null)
  const [doubleSided, setDoubleSided] = useState(false)
  const [quantity, setQuantity]       = useState(1)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data)
        if (res.data.sizes?.length > 0) setSelectedSize(res.data.sizes[0].size)
        // double impression pré-cochée si activée sur le produit
        setDoubleSided(res.data.doubleSided ?? false)
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>
      <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
    </div>
  )

  if (!product) return null

  const selectedSizeObj = product.sizes?.find(s => s.size === selectedSize)
  const basePrice       = selectedSizeObj?.price ?? 0
  const extraPrice      = (doubleSided && product.doubleSided) ? (product.doubleSidedPrice ?? 0) : 0
  const unitPrice       = basePrice + extraPrice
  const images          = product.images?.length > 0 ? product.images : ['/placeholder.jpg']

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Veuillez sélectionner une taille'); return }
    addToCart({ ...product, computedPrice: unitPrice }, selectedSize, quantity, doubleSided)
    toast.success(`${product.name} ajouté au panier !`)
  }

  return (
    <div className="min-h-screen pt-20"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>

      {/* Retour */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium transition-colors group"
          style={{ color: PURPLE }}>
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ── Galerie ── */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white group shadow-sm">
              <img src={images[currentImage]} alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {images.length > 1 && (<>
                <button onClick={() => setCurrentImage(i => i === 0 ? images.length - 1 : i - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90
                             rounded-full flex items-center justify-center shadow opacity-0
                             group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ChevronLeft size={18} style={{ color: NAVY }} />
                </button>
                <button onClick={() => setCurrentImage(i => i === images.length - 1 ? 0 : i + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90
                             rounded-full flex items-center justify-center shadow opacity-0
                             group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ChevronRight size={18} style={{ color: NAVY }} />
                </button>
              </>)}
              <div className="absolute top-3 left-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow"
                  style={{ background: PURPLE }}>
                  {product.category}
                </span>
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className="aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all"
                    style={{ borderColor: i === currentImage ? PURPLE : 'transparent' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Infos ── */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-black text-4xl sm:text-5xl leading-tight mb-4 italic"
                style={{ color: NAVY }}>
                {product.name}
              </h1>
              <p className="font-black text-3xl" style={{ color: PURPLE }}>
                {unitPrice.toLocaleString('fr-DZ')}
                <span className="text-base font-normal text-gray-400 ml-2">DA</span>
              </p>
              {doubleSided && extraPrice > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Inclut +{extraPrice.toLocaleString('fr-DZ')} DA (recto-verso)
                </p>
              )}
            </div>

            <div className="h-px bg-purple-100" />

            {/* Tailles */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>
                Taille {selectedSize && <span style={{ color: PURPLE }} className="ml-2">— {selectedSize}</span>}
              </p>
              <SizeSelector sizes={product.sizes || []} selected={selectedSize}
                onChange={size => { setSelectedSize(size); setQuantity(1) }} />
            </div>

            {/* Couleurs */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>
                  Couleurs disponibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    <span key={c} className="px-3 py-1 rounded-full text-sm font-medium border"
                      style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE, background: 'rgba(124,58,237,0.06)' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Double impression */}
            {product.doubleSided && (
              <div className="rounded-2xl border-2 p-4 cursor-pointer transition-all"
                style={{
                  borderColor: doubleSided ? PURPLE : '#e5e7eb',
                  background:  doubleSided ? 'rgba(124,58,237,0.04)' : '#f9fafb',
                }}
                onClick={() => setDoubleSided(d => !d)}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-6 rounded-full transition-colors"
                      style={{ background: doubleSided ? PURPLE : '#d1d5db' }}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                                       ${doubleSided ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: NAVY }}>
                      Impression des deux côtés
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.doubleSidedPrice > 0
                        ? `+${product.doubleSidedPrice.toLocaleString('fr-DZ')} DA`
                        : 'Inclus'}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Quantité */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>
                Quantité
              </p>
              <QuantitySelector value={quantity} min={1} max={99} onChange={setQuantity} />
            </div>

            {/* Bouton panier */}
            <button onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                         text-white font-black text-base transition-all hover:opacity-90
                         hover:scale-[1.02] shadow-lg"
              style={{ background: PURPLE }}>
              <ShoppingBag size={20} />
              Ajouter au panier
            </button>

            {/* Livraison */}
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <span className="text-2xl">🚚</span>
              <div>
                <p className="font-bold text-sm" style={{ color: NAVY }}>
                  Livraison dans toute l'Algérie
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Paiement à la livraison · 2 à 5 jours ouvrables
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage