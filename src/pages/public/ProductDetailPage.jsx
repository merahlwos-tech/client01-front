import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight, Zap, ChevronDown, Check } from 'lucide-react'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'
import SizeSelector from '../../Components/public/SizeSelector'
import QuantitySelector from '../../Components/public/QuantitySelector'
import { useLang } from '../../context/LanguageContext'
import { trackViewContent, trackAddToCart, trackHighQualityVisitor, trackScrollToForm } from '../../utils/metaPixel'
import { useSEO } from '../../utils/UseSEO'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const CAT_LABELS_FR = { Board: 'Boites', Bags: 'Sacs', Autocollants: 'Cartes', Paper: 'Papier' }
const CAT_LABELS_AR = { Board: 'صناديق', Bags: 'أكياس', Autocollants: 'بطاقات', Paper: 'ورق' }

const COLOR_NAMES = {
  '#000000': { fr: 'Noir',        ar: 'أسود' },
  '#FFFFFF': { fr: 'Blanc',       ar: 'أبيض' },
  '#EF4444': { fr: 'Rouge',       ar: 'أحمر' },
  '#3B82F6': { fr: 'Bleu',        ar: 'أزرق' },
  '#22C55E': { fr: 'Vert',        ar: 'أخضر' },
  '#EAB308': { fr: 'Jaune',       ar: 'أصفر' },
  '#F97316': { fr: 'Orange',      ar: 'برتقالي' },
  '#EC4899': { fr: 'Rose',        ar: 'وردي' },
  '#A855F7': { fr: 'Violet',      ar: 'بنفسجي' },
  '#92400E': { fr: 'Marron',      ar: 'بني' },
  '#6B7280': { fr: 'Gris',        ar: 'رمادي' },
  '#D97706': { fr: 'Doré',        ar: 'ذهبي' },
  '#94A3B8': { fr: 'Argenté',     ar: 'فضي' },
  '#1E3A8A': { fr: 'Bleu marine', ar: 'أزرق داكن' },
  '#7F1D1D': { fr: 'Bordeaux',    ar: 'بوردو' },
  '#0D9488': { fr: 'Turquoise',   ar: 'تركوازي' },
  '#F5E6C8': { fr: 'Beige',       ar: 'بيج' },
  '#8B5CF6': { fr: 'Lavande',     ar: 'لافندر' },
}

function ColorDropdown({ colors, value, onChange, lang }) {
  const [open, setOpen] = React.useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = value
    ? (COLOR_NAMES[value]?.[lang] || COLOR_NAMES[value]?.fr || value)
    : (lang === 'ar' ? 'اختر لوناً *' : 'Choisir une couleur *')

  return (
    <div ref={ref} className="relative w-full">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: NAVY }}>
        {lang === 'ar' ? 'الألوان المتاحة' : 'Couleur disponible'} <span style={{ color: '#ef4444' }}>*</span>
      </p>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all"
        style={{
          borderColor: open ? PURPLE : value ? PURPLE : 'rgba(124,58,237,0.3)',
          background: 'white', color: NAVY,
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
        }}>
        <span className="flex items-center gap-2.5">
          {label}
        </span>
        <ChevronDown size={16} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          style={{ color: PURPLE }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: 'white',
            border: '2px solid rgba(124,58,237,0.2)',
            boxShadow: '0 8px 32px rgba(124,58,237,0.15)',
          }}>
          <div className="max-h-52 overflow-y-auto py-1">
            {colors.map(hex => {
              const name = COLOR_NAMES[hex]?.[lang] || COLOR_NAMES[hex]?.fr || hex
              return (
                <button key={hex} type="button"
                  onClick={() => { onChange(hex); setOpen(false) }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-all text-left"
                  style={{
                    background: value === hex ? 'rgba(124,58,237,0.08)' : 'transparent',
                    color: value === hex ? PURPLE : NAVY,
                  }}
                  onMouseEnter={e => { if (value !== hex) e.currentTarget.style.background = 'rgba(124,58,237,0.04)' }}
                  onMouseLeave={e => { if (value !== hex) e.currentTarget.style.background = 'transparent' }}>
                  <span className="flex items-center gap-2.5">
                    {name}
                  </span>
                  {value === hex && <Check size={14} style={{ color: PURPLE }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductDetailPage() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const { addToCart }   = useCart()
  const { t, lang, isRTL } = useLang()

  const [product, setProduct]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [selectedSize, setSelectedSize] = useState(null)
  const [doubleSided, setDoubleSided]   = useState(false)
  const [quantity, setQuantity]         = useState(100)
  const [currentImage, setCurrentImage] = useState(0)
  const [selectedColor, setSelectedColor]   = useState('')
  const [numberOfColors, setNumberOfColors] = useState('1')

  // SEO dynamique — se met à jour dès que le produit est chargé
  const seoCatLabels = { Board: 'Boite', Bags: 'Sac', Autocollants: 'Carte', Paper: 'Papier' }
  useSEO({
    title: product ? product.name : 'Produit',
    description: product
      ? `${product.name} — ${seoCatLabels[product.category] || 'Emballage'} personnalisé à partir de ${Math.min(...(product.sizes?.map(s => s.price) || [0])).toLocaleString('fr-DZ')} DA. Commandez sur BrandPack Algérie.`
      : 'Emballage personnalisé BrandPack Algérie.',
  })
  useEffect(() => { window.scrollTo(0, 0) }, [id])

  // ── High Intent : timer 30s + scroll vers le formulaire ──────────────────
  useEffect(() => {
    if (!product) return

    // 1. HighQualityVisitor — resté +30s sur la fiche produit
    const timer = setTimeout(() => {
      trackHighQualityVisitor(product._id, product.name)
    }, 30000)

    // 2. ScrollToForm — scroll jusqu'au bas de page (où se trouve le formulaire)
    let scrollFired = false
    const onScroll = () => {
      if (scrollFired) return
      const scrolled = window.scrollY + window.innerHeight
      const threshold = document.body.scrollHeight - 500
      if (scrolled >= threshold) {
        scrollFired = true
        trackScrollToForm(product._id, product.name)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [product])

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data)
        if (res.data.sizes?.length > 0) setSelectedSize(res.data.sizes[0].size)
        setDoubleSided(false)  // toujours désactivé par défaut, le client l'active si besoin
        // ViewContent : on utilise le prix de la première taille disponible
        const firstPrice = res.data.sizes?.[0]?.price ?? 0
        trackViewContent(res.data, firstPrice)
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#f5f3ff,#ede9fe,#e0e7ff)' }}>
      <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
    </div>
  )
  if (!product) return null

  const catLabels     = lang === 'ar' ? CAT_LABELS_AR : CAT_LABELS_FR
  const catLabel      = catLabels[product.category] || product.category
  const sizeObj       = product.sizes?.find(s => s.size === selectedSize)
  const basePrice     = sizeObj?.price ?? 0
  const extraDouble   = (doubleSided && product.doubleSided) ? (product.doubleSidedPrice ?? 0) : 0
  const nbColors      = numberOfColors !== '' ? Math.max(1, Number(numberOfColors)) : 1
  const extraColors   = (product.colorDesignEnabled && nbColors > 0) ? nbColors * (product.colorDesignPricePerColor ?? 0) : 0
  const extraPrice    = extraDouble + extraColors
  const unitPrice     = basePrice + extraPrice
  const totalPrice    = unitPrice * quantity
  const images        = product.images?.length > 0 ? product.images : ['/placeholder.jpg']

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error(t('selectSize')); return }
    if (product.colors?.length > 0 && !selectedColor) { toast.error(lang === 'ar' ? 'يرجى اختيار لون' : 'Veuillez choisir une couleur'); return }
    addToCart({ ...product, computedPrice: unitPrice }, selectedSize, quantity, doubleSided, selectedColor ? [COLOR_NAMES[selectedColor]?.[lang] || COLOR_NAMES[selectedColor]?.fr || selectedColor] : [], nbColors)
    trackAddToCart(product, selectedSize, quantity, unitPrice)
    toast.success(`${product.name} ${t('added')}`)
  }

  const handleBuyNow = () => {
    if (!selectedSize) { toast.error(t('selectSize')); return }
    if (product.colors?.length > 0 && !selectedColor) { toast.error(lang === 'ar' ? 'يرجى اختيار لون' : 'Veuillez choisir une couleur'); return }
    addToCart({ ...product, computedPrice: unitPrice }, selectedSize, quantity, doubleSided, selectedColor ? [COLOR_NAMES[selectedColor]?.[lang] || COLOR_NAMES[selectedColor]?.fr || selectedColor] : [], nbColors)
    trackAddToCart(product, selectedSize, quantity, unitPrice)
    navigate('/cart')
  }

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}
      dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── DESKTOP : grid 2 colonnes ── */}
      <div className="hidden lg:block pt-20">
        <div className="max-w-7xl mx-auto px-8 py-10">

          {/* Retour */}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium mb-8 group transition-colors"
            style={{ color: PURPLE }}>
            <ArrowLeft size={16} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
            {t('back')}
          </button>

          <div className="grid grid-cols-2 gap-16 items-start">

            {/* Colonne gauche — Galerie */}
            <div className="sticky top-28 space-y-3">
              <div className="relative rounded-3xl overflow-hidden bg-white group shadow-sm"
                style={{ aspectRatio: '1/1' }}>
                <img src={images[currentImage]} alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {images.length > 1 && (<>
                  <button onClick={() => setCurrentImage(i => i === 0 ? images.length - 1 : i - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                               flex items-center justify-center text-white opacity-0 group-hover:opacity-100
                               transition-all backdrop-blur-sm"
                    style={{ background: 'rgba(30,27,75,0.5)' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setCurrentImage(i => i === images.length - 1 ? 0 : i + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                               flex items-center justify-center text-white opacity-0 group-hover:opacity-100
                               transition-all backdrop-blur-sm"
                    style={{ background: 'rgba(30,27,75,0.5)' }}>
                    <ChevronRight size={20} />
                  </button>
                </>)}
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white shadow"
                    style={{ background: PURPLE }}>{catLabel}</span>
                </div>
              </div>

              {/* Miniatures */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className="aspect-square rounded-xl overflow-hidden border-2 transition-all"
                      style={{ borderColor: i === currentImage ? PURPLE : 'transparent' }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite — Options */}
            <div className="space-y-7">
              <div>
                <h1 className="font-black italic text-5xl leading-tight mb-3" style={{ color: NAVY }}>
                  {product.name}
                </h1>
                <p className="font-black text-3xl" style={{ color: PURPLE }}>
                  {unitPrice.toLocaleString('fr-DZ')}
                  <span className="text-base font-normal text-gray-400 ml-2">DA / {t('units').slice(0,-1) || 'unité'}</span>
                </p>
                {doubleSided && extraDouble > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === 'ar' ? `يشمل +${extraDouble.toLocaleString('fr-DZ')} دج (وجهان)` : `Inclut +${extraDouble.toLocaleString('fr-DZ')} DA (recto-verso)`}
                  </p>
                )}
                {product.colorDesignEnabled && nbColors > 0 && extraColors > 0 && (
                  <p className="text-xs mt-1" style={{ color: PURPLE }}>
                    {lang === 'ar'
                      ? `+${extraColors.toLocaleString('fr-DZ')} دج (${nbColors} × ${(product.colorDesignPricePerColor).toLocaleString('fr-DZ')} دج/لون)`
                      : `+${extraColors.toLocaleString('fr-DZ')} DA (${nbColors} × ${(product.colorDesignPricePerColor).toLocaleString('fr-DZ')} DA/couleur)`}
                  </p>
                )}
              </div>
              <div className="h-px bg-purple-100" />

              {/* Tailles */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>
                  {t('availableSizes')}
                  {selectedSize && <span style={{ color: PURPLE }} className="ml-2">— {selectedSize}</span>}
                </p>
                <SizeSelector sizes={product.sizes || []} selected={selectedSize}
                  onChange={s => setSelectedSize(s)} />
              </div>

              {/* Couleurs */}
              {product.colors?.length > 0 && (
                <ColorDropdown
                  colors={product.colors}
                  value={selectedColor}
                  onChange={setSelectedColor}
                  lang={lang}
                />
              )}

              {/* Nombre de couleurs dans le design */}
              {product.colorDesignEnabled && (
                <div className="rounded-2xl border-2 p-4 transition-all"
                  style={{ borderColor: nbColors > 0 ? PURPLE : '#e5e7eb', background: nbColors > 0 ? 'rgba(124,58,237,0.04)' : '#f9fafb' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: NAVY }}>
                    {t('numberOfColors')}
                  </p>
                  <input
                    type="number" min="1"
                    max={product.colorDesignMaxColors || undefined}
                    value={numberOfColors}
                    onChange={e => setNumberOfColors(e.target.value)}
                    placeholder={t('numberOfColorsPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all focus:border-purple-400"
                    style={{ borderColor: '#e5e7eb', color: NAVY }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: PURPLE }}>
                    {lang === 'ar'
                      ? t('colorDesignInfo', { price: product.colorDesignPricePerColor })
                      : t('colorDesignInfo', { price: product.colorDesignPricePerColor })}
                  </p>
                  {product.colorDesignMaxColors && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('colorDesignMax', { max: product.colorDesignMaxColors })}
                    </p>
                  )}
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
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${doubleSided ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: NAVY }}>{t('doubleSided')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {product.doubleSidedPrice > 0
                          ? `+${product.doubleSidedPrice.toLocaleString('fr-DZ')} DA / ${t('units')}`
                          : (t('included'))}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Quantité */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>
                  {t('quantity')}
                </p>
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>

              {/* Total */}
              <div className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('estimatedTotal')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {quantity.toLocaleString()} × {unitPrice.toLocaleString('fr-DZ')} DA
                  </p>
                </div>
                <p className="font-black text-3xl" style={{ color: PURPLE }}>
                  {totalPrice.toLocaleString('fr-DZ')}
                  <span className="text-sm font-normal text-gray-400 ml-1">DA</span>
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl
                             font-black text-base transition-all hover:bg-purple-50 border-2"
                  style={{ borderColor: PURPLE, color: PURPLE }}>
                  <ShoppingBag size={20} />
                  {t('addToCart')}
                </button>
                <button onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl
                             text-white font-black text-base transition-all hover:opacity-90 shadow-lg"
                  style={{ background: PURPLE }}>
                  <Zap size={20} />
                  {t('orderNow')}
                </button>
              </div>

              {/* Livraison */}
              <div className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: NAVY }}>{t('deliveryInfo')}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t('deliveryDetail')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE : image pleine largeur ── */}
      <div className="lg:hidden">
        {/* Image hero */}
        <div className="relative w-full" style={{ height: '60vh', minHeight: 300 }}>
          <img src={images[currentImage]} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom,rgba(30,27,75,0.1),rgba(30,27,75,0.6))' }} />

          <button onClick={() => navigate(-1)}
            className="absolute top-20 left-4 flex items-center gap-2 px-3 py-2 rounded-full
                       text-white text-sm font-medium backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <ArrowLeft size={15} /> {t('back')}
          </button>

          <div className="absolute top-20 right-4">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
              style={{ background: PURPLE }}>{catLabel}</span>
          </div>

          {images.length > 1 && (<>
            <button onClick={() => setCurrentImage(i => i === 0 ? images.length - 1 : i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentImage(i => i === images.length - 1 ? 0 : i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ChevronRight size={18} />
            </button>
          </>)}

          <div className="absolute bottom-5 left-5 right-5">
            <h1 className="text-white font-black italic text-2xl drop-shadow mb-1">{product.name}</h1>
            <p className="text-white font-black text-lg drop-shadow">
              {unitPrice.toLocaleString('fr-DZ')}
              <span className="text-xs opacity-70 ml-1">DA / {t('units')}</span>
            </p>
          </div>
        </div>

        {/* Panel mobile */}
        <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto">

          {/* Tailles */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>
              {t('availableSizes')}{selectedSize && <span style={{ color: PURPLE }} className="ml-2">— {selectedSize}</span>}
            </p>
            <SizeSelector sizes={product.sizes || []} selected={selectedSize} onChange={s => setSelectedSize(s)} />
          </div>

          {/* Couleurs */}
          {product.colors?.length > 0 && (
            <ColorDropdown
              colors={product.colors}
              value={selectedColor}
              onChange={setSelectedColor}
              lang={lang}
            />
          )}

          {/* Nombre de couleurs dans le design */}
          {product.colorDesignEnabled && (
            <div className="rounded-2xl border-2 p-4 transition-all"
              style={{ borderColor: nbColors > 0 ? PURPLE : '#e5e7eb', background: nbColors > 0 ? 'rgba(124,58,237,0.04)' : '#f9fafb' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: NAVY }}>
                {t('numberOfColors')}
              </p>
              <input
                type="number" min="1"
                max={product.colorDesignMaxColors || undefined}
                value={numberOfColors}
                onChange={e => setNumberOfColors(e.target.value)}
                placeholder={t('numberOfColorsPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all focus:border-purple-400"
                style={{ borderColor: '#e5e7eb', color: NAVY }}
              />
              <p className="text-xs mt-1.5" style={{ color: PURPLE }}>
                {t('colorDesignInfo', { price: product.colorDesignPricePerColor })}
              </p>
              {product.colorDesignMaxColors && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('colorDesignMax', { max: product.colorDesignMaxColors })}
                </p>
              )}
            </div>
          )}

          {/* Double impression */}
          {product.doubleSided && (
            <div className="rounded-2xl border-2 p-4 cursor-pointer transition-all"
              style={{ borderColor: doubleSided ? PURPLE : '#e5e7eb', background: doubleSided ? 'rgba(124,58,237,0.04)' : '#f9fafb' }}
              onClick={() => setDoubleSided(d => !d)}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-6 rounded-full transition-colors" style={{ background: doubleSided ? PURPLE : '#d1d5db' }}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${doubleSided ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{t('doubleSided')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {product.doubleSidedPrice > 0 ? `+${product.doubleSidedPrice.toLocaleString('fr-DZ')} DA` : (t('included'))}
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Quantité */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>{t('quantity')}</p>
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          {/* Total */}
          <div className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('estimatedTotal')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{quantity.toLocaleString()} × {unitPrice.toLocaleString('fr-DZ')} DA</p>
            </div>
            <p className="font-black text-2xl" style={{ color: PURPLE }}>
              {totalPrice.toLocaleString('fr-DZ')}<span className="text-sm font-normal text-gray-400 ml-1">DA</span>
            </p>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <button onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base
                         border-2 transition-all hover:bg-purple-50"
              style={{ borderColor: PURPLE, color: PURPLE }}>
              <ShoppingBag size={20} /> {t('addToCart')}
            </button>
            <button onClick={handleBuyNow}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-base
                         transition-all hover:opacity-90 shadow-lg"
              style={{ background: PURPLE }}>
              <Zap size={20} /> {t('orderNow')}
            </button>
          </div>

          {/* Livraison */}
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <span className="text-2xl">🚚</span>
            <div>
              <p className="font-bold text-sm" style={{ color: NAVY }}>{t('deliveryInfo')}</p>
              <p className="text-gray-500 text-xs mt-0.5">{t('deliveryDetail')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage