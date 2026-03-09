import { Trash2 } from 'lucide-react'
import QuantitySelector from './QuantitySelector'
import { useCart } from '../../context/CartContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart()
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-sm leading-tight mb-1" style={{ color: NAVY }}>
            {item.name}
          </h4>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: PURPLE }}>
              {item.size}
            </span>
            {item.doubleSided && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: NAVY }}>
                Recto-verso
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <QuantitySelector value={item.quantity} min={1} max={99}
            onChange={qty => updateQuantity(item.key, qty)} />
          <div className="flex items-center gap-3">
            <span className="font-black text-sm" style={{ color: PURPLE }}>
              {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
            </span>
            <button onClick={() => removeFromCart(item.key)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItem