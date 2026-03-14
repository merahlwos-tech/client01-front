import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2, AlertTriangle, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'
import CartItem from '../../Components/public/CartItem'
import CheckoutForm from '../../Components/public/CheckoutForm'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from '../../utils/metaPixel'
import { useSEO } from '../../utils/UseSEO'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

/* ── Popup de confirmation de commande ── */
function ConfirmOrderPopup({ customerInfo, onConfirm, onCancel, t, isRTL, lang }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(30,27,75,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl"
        dir={isRTL ? 'rtl' : 'ltr'}>

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.1)' }}>
              <AlertTriangle size={20} style={{ color: PURPLE }} />
            </div>
            <h2 className={`font-black text-lg leading-tight ${lang === 'ar' ? 'font-arabic' : ''}`}
              style={{ color: NAVY }}>
              {t('popupTitle')}
            </h2>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 flex-shrink-0">
            <X size={16} style={{ color: '#6b7280' }} />
          </button>
        </div>

        <p className={`text-sm text-gray-500 mb-4 ${lang === 'ar' ? 'font-arabic' : ''}`}>
          {t('popupSubtitle')}
        </p>

        <div className="rounded-2xl p-4 mb-4 space-y-2.5"
          style={{ background: '#f8f7ff', border: '1px solid rgba(124,58,237,0.15)' }}>
          {[
            { label: lang === 'ar' ? 'الاسم' : 'Nom',        value: `${customerInfo.firstName} ${customerInfo.lastName}` },
            { label: lang === 'ar' ? 'الهاتف' : 'Téléphone', value: customerInfo.phone },
            { label: lang === 'ar' ? 'الولاية' : 'Wilaya',   value: customerInfo.wilaya },
            { label: lang === 'ar' ? 'البلدية' : 'Commune',  value: customerInfo.commune },
          ].map(({ label, value }) => (
            <div key={label}
              className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-400 font-medium" style={{ minWidth: '80px' }}>{label} :</span>
              <span className="font-bold truncate" style={{ color: NAVY }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl px-4 py-3 mb-6"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <p className={`text-sm text-orange-700 leading-relaxed ${lang === 'ar' ? 'font-arabic text-right' : ''}`}>
            {t('popupWarning')}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90 shadow-lg"
            style={{ background: PURPLE }}>
            ✅ {t('popupConfirm')}
          </button>
          <button onClick={onCancel}
            className="w-full py-3 rounded-2xl border-2 font-bold text-sm transition-all hover:bg-gray-50"
            style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
            ✏️ {t('popupEdit')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CartPage() {
  const { items, total, clearCart } = useCart()
  const { t, isRTL, lang } = useLang()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState({ fee: null, method: null })
  const [pendingOrder, setPendingOrder] = useState(null)

  const totalUnits = items.reduce((s, i) => s + Number(i.quantity), 0)
  const isFreeDelivery = totalUnits >= 500 && deliveryInfo.method === 'Stop Desk'
  const effectiveDeliveryFee = isFreeDelivery ? 0 : Number(deliveryInfo.fee ?? 0)
  const totalWithDelivery = Number(total) + effectiveDeliveryFee

  useSEO({ title: 'Mon panier', description: "Finalisez votre commande d'emballages personnalisés BrandPack." })

  useEffect(() => {
    if (items.length > 0) trackInitiateCheckout(items, total)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = (customerInfo) => {
    if (items.length === 0) { toast.error('Votre panier est vide'); return }
    const info = isFreeDelivery ? { ...customerInfo, deliveryFee: 0 } : customerInfo
    setPendingOrder(info)
  }

  const handleConfirmedOrder = async () => {
    const customerInfo = pendingOrder
    setPendingOrder(null)
    setSubmitting(true)
    trackAddPaymentInfo(items, totalWithDelivery)
    const metaEventId = trackPurchase(items, totalWithDelivery)
    try {
      await api.post('/orders', {
        customerInfo,
        items: items.map(item => ({
          product:        item.productId,
          name:           item.name,
          size:           item.size,
          doubleSided:    item.doubleSided,
          selectedColors: item.selectedColors || [],
          numberOfColors: item.numberOfColors || null,
          quantity:       item.quantity,
          price:          item.price,
        })),
        total: totalWithDelivery,
        metaEventId,
      })
      clearCart()
      navigate('/confirmation', { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 503 || status === 502) navigate('/server-error')
      else toast.error(err.response?.data?.message || 'Erreur lors de la commande.')
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

      {pendingOrder && (
        <ConfirmOrderPopup
          customerInfo={pendingOrder}
          onConfirm={handleConfirmedOrder}
          onCancel={() => setPendingOrder(null)}
          t={t} isRTL={isRTL} lang={lang}
        />
      )}

      <div className="pt-20 pb-6 px-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
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

            {isFreeDelivery ? (
              <div className="rounded-2xl px-4 py-3 text-center font-bold text-sm"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.4)', color: '#065f46' }}>
                {t('freeDelivery')}
              </div>
            ) : totalUnits > 0 && (
              <div className="rounded-2xl px-4 py-3 text-center text-xs font-medium"
                style={{ background: 'rgba(124,58,237,0.04)', border: '1px dashed rgba(124,58,237,0.25)', color: '#7c3aed' }}>
                {lang === 'ar'
                  ? `أضف ${500 - totalUnits} وحدة للحصول على توصيل مجاني إلى المكتب 🚚`
                  : `Ajoutez ${500 - totalUnits} unités pour la livraison Stop Desk gratuite 🚚`}
              </div>
            )}

            <div className="lg:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('total')}</span>
                <span className="font-black text-2xl" style={{ color: PURPLE }}>
                  {totalWithDelivery.toLocaleString('fr-DZ')}
                  <span className="text-sm font-normal text-gray-400 ml-1">DA</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">

              <div className="hidden lg:block bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: PURPLE }}>
                  {t('summary')}
                </p>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.key} className="flex justify-between items-start gap-3 text-sm py-1.5"
                      style={{ borderBottom: '1px solid #f9fafb' }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: NAVY }}>{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.size}
                          {item.doubleSided && <span className="ml-1">(r-v)</span>}
                          {item.selectedColors?.length > 0 && <span className="ml-1">· {item.selectedColors[0]}</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm" style={{ color: PURPLE }}>
                          {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                        </p>
                        <p className="text-xs text-gray-400">× {item.quantity.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-2" style={{ borderTop: '2px solid #f3f4f6' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {lang === 'ar' ? 'التوصيل' : 'Livraison'}
                      {deliveryInfo.method && (
                        <span className="text-xs text-purple-400 ml-1">({deliveryInfo.method})</span>
                      )}
                    </span>
                    <span className="font-bold text-sm" style={{ color: isFreeDelivery ? '#10b981' : NAVY }}>
                      {isFreeDelivery
                        ? (lang === 'ar' ? '🎉 مجاني' : '🎉 Gratuit')
                        : deliveryInfo.fee != null
                          ? `${Number(deliveryInfo.fee).toLocaleString('fr-DZ')} DA`
                          : '—'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-bold" style={{ color: NAVY }}>{t('total')}</span>
                    <span className="font-black text-2xl" style={{ color: PURPLE }}>
                      {totalWithDelivery.toLocaleString('fr-DZ')}
                      <span className="text-sm font-normal text-gray-400 ml-1">DA</span>
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs text-right">{t('cashOnDelivery')}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
                  {t('deliveryInfo2')}
                </p>
                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  loading={submitting}
                  onDeliveryChange={setDeliveryInfo}
                  isFreeDelivery={isFreeDelivery}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage