import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import CartItem from '../../Components/public/CartItem'
import CheckoutForm from '../../Components/public/CheckoutForm'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useState } from 'react'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function CartPage() {
  const { items, total, clearCart } = useCart()
  const navigate   = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleOrder = async (customerInfo) => {
    if (items.length === 0) { toast.error('Votre panier est vide'); return }
    setSubmitting(true)
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
      })
      clearCart()
      navigate('/confirmation', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande.')
    } finally { setSubmitting(false) }
  }

  if (items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center pt-20"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>
      <div className="text-center px-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          🛒
        </div>
        <h2 className="text-3xl font-black italic mb-2" style={{ color: NAVY }}>Panier vide</h2>
        <p className="text-gray-500 mb-8">Découvrez notre sélection d'emballages</p>
        <Link to="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold
                     transition-all hover:opacity-90 shadow-lg"
          style={{ background: PURPLE }}>
          <ShoppingBag size={16} /> Découvrir la boutique
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-20"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>

      {/* Header */}
      <div className="py-10 px-6" style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-sm font-medium mb-4 group transition-colors"
            style={{ color: PURPLE }}>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Continuer mes achats
          </button>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>
            Récapitulatif
          </p>
          <h1 className="text-4xl font-black italic" style={{ color: NAVY }}>
            Mon panier 🛍️
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Articles */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {items.length} article{items.length !== 1 ? 's' : ''}
              </p>
              <button onClick={clearCart}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={12} /> Vider
              </button>
            </div>
            {items.map(item => <CartItem key={item.key} item={item} />)}
          </div>

          {/* Résumé + Formulaire */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-5">

              {/* Total */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: PURPLE }}>
                  Total
                </p>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.key} className="flex justify-between text-sm">
                      <span className="text-gray-500 truncate mr-4 flex-1">
                        {item.name} ×{item.quantity}
                        {item.doubleSided && <span className="text-xs text-gray-400 ml-1">(r-v)</span>}
                      </span>
                      <span className="font-bold whitespace-nowrap" style={{ color: NAVY }}>
                        {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gray-100 mb-4" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="font-black text-3xl" style={{ color: PURPLE }}>
                    {total.toLocaleString('fr-DZ')}
                    <span className="text-sm font-normal text-gray-400 ml-1">DA</span>
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1 text-right">Paiement à la livraison</p>
              </div>

              {/* Formulaire livraison */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
                  Informations de livraison
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