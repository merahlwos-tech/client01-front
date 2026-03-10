import { Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function CartItem({ item }) {
  const { removeFromCart } = useCart()
  const { lang } = useLang()

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"
              loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
      </div>

      {/* Infos */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h4 className="font-bold text-sm leading-tight truncate" style={{ color: NAVY }}>
            {item.name}
          </h4>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: PURPLE }}>
              {item.size}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.08)', color: PURPLE }}>
              {item.quantity.toLocaleString('fr-DZ')} {lang === 'ar' ? 'وحدة' : 'unités'}
            </span>
            {item.doubleSided && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: NAVY }}>
                {lang === 'ar' ? 'وجهان' : 'Recto-verso'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs text-gray-400">
              {item.price.toLocaleString('fr-DZ')} DA × {item.quantity.toLocaleString('fr-DZ')}
            </p>
            <p className="font-black text-base" style={{ color: PURPLE }}>
              {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
            </p>
          </div>
          <button onClick={() => removeFromCart(item.key)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartItem