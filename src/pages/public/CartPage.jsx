import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'
import CartItem from '../../Components/public/CartItem'
import CheckoutForm from '../../Components/public/CheckoutForm'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { trackInitiateCheckout, trackPurchase } from '../../utils/metaPixel'
import { useSEO } from '../../utils/UseSEO'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function CartPage() {
  const { items, total, clearCart } = useCart()
  const { t, isRTL } = useLang()
  const navigate      = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  useSEO({ title: 'Mon panier', description: 'Finalisez votre commande d\'emballages personnalisés BrandPack.' })
  // InitiateCheckout — déclenché une fois quand l'utilisateur arrive sur la page panier
  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout(items, total)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrder = async (customerInfo) => {
    if (items.length === 0) { toast.error('Votre panier est vide'); return }
    setSubmitting(true)

    // 1. Pixel Purchase (côté client) — retourne l'event_id pour déduplication CAPI
    const metaEventId = trackPurchase(items, total)

    try {
      await api.post('/orders', {
        customerInfo,
        items: items.map(item => ({
          product:     item.productId,
          name:        item.name,
          size:        item.size,
          doubleSided: item.doubleSided,
          quantity:    item.quantity,
          price:       item.price,
        })),
        total,
        metaEventId, // 2. Transmis au backend → CAPI Purchase avec même event_id
      })
      clearCart()
      navigate('/confirmation', { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 503 || status === 502) {
        navigate('/server-error')
      } else {
        toast.error(err.response?.data?.message || 'Erreur lors de la commande.')
      }
    } finally { setSubmitting(false) }
  }

  if (items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center pt-20"
      style={{ background: 'linear-gradient(160deg,#f5f3ff,#ede9fe,#e0e7ff)' }}
      dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center px-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ background: 'rgba(124,58,237,0.1)' }}>🛒</div>
        <h2 className="text-3xl font-black italic mb-2" style={{ color: NAVY }}>{t('emptyCart')}</h2>
        <p className="text-gray-500 mb-8">{t('emptyCartDesc')}</p>
        <Link to="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-lg"
          style={{ background: PURPLE }}>
          <ShoppingBag size={16} /> {t('discover')}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}
      dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="pt-20 pb-6 px-4"
        style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-sm font-medium mb-3 group"
            style={{ color: PURPLE }}>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('continueShopping')}
          </button>
          <h1 className="text-3xl font-black italic" style={{ color: NAVY }}>{t('myCart')}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Articles */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: NAVY }}>
                {items.length} {items.length > 1 ? t('references_pl') : t('references')}
              </p>
              <button onClick={clearCart}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={12} /> {t('clear')}
              </button>
            </div>
            {items.map(item => <CartItem key={item.key} item={item} />)}

            {/* Total mobile */}
            <div className="lg:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('total')}</span>
                <span className="font-black text-2xl" style={{ color: PURPLE }}>
                  {total.toLocaleString('fr-DZ')}
                  <span className="text-sm font-normal text-gray-400 ml-1">DA</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">

              {/* Récap desktop */}
              <div className="hidden lg:block bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: PURPLE }}>
                  {t('summary')}
                </p>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.key} className="flex justify-between text-sm">
                      <span className="text-gray-500 truncate mr-4 flex-1">
                        {item.name}
                        <span className="text-gray-400 ml-1">× {item.quantity.toLocaleString()}</span>
                        {item.doubleSided && <span className="text-gray-400 ml-1">(r-v)</span>}
                      </span>
                      <span className="font-bold whitespace-nowrap" style={{ color: NAVY }}>
                        {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gray-100 mb-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('total')}</span>
                  <span className="font-black text-2xl" style={{ color: PURPLE }}>
                    {total.toLocaleString('fr-DZ')}
                    <span className="text-sm font-normal text-gray-400 ml-1">DA</span>
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1 text-right">{t('cashOnDelivery')}</p>
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
                  {t('deliveryInfo2')}
                </p>
                <CheckoutForm onSubmit={handleOrder} loading={submitting} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage