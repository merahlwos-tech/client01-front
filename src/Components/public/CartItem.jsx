import { Trash2, ChevronDown, Check } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLang } from '../../context/LanguageContext'
import { useState, useRef, useEffect } from 'react'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const QTY_OPTIONS = [100,200,300,400,500,600,700,800,900,1000,1500,2000,3000,5000]

function QtyDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all"
        style={{ borderColor: open ? PURPLE : 'rgba(124,58,237,0.3)', color: NAVY, background: 'white' }}>
        {value.toLocaleString('fr-DZ')}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: PURPLE }} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 rounded-xl overflow-hidden z-50 min-w-[90px]"
          style={{ background: 'white', border: '2px solid rgba(124,58,237,0.2)', boxShadow: '0 8px 24px rgba(124,58,237,0.15)' }}>
          <div className="max-h-44 overflow-y-auto py-1">
            {QTY_OPTIONS.map(q => (
              <button key={q} type="button" onClick={() => { onChange(q); setOpen(false) }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition-all"
                style={{ background: value === q ? 'rgba(124,58,237,0.08)' : 'transparent', color: value === q ? PURPLE : NAVY }}
                onMouseEnter={e => { if (value !== q) e.currentTarget.style.background = 'rgba(124,58,237,0.04)' }}
                onMouseLeave={e => { if (value !== q) e.currentTarget.style.background = 'transparent' }}>
                {q.toLocaleString('fr-DZ')}
                {value === q && <Check size={11} style={{ color: PURPLE }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCart()
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
            <QtyDropdown value={item.quantity} onChange={qty => updateQuantity(item.key, qty)} />
            {item.doubleSided && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: NAVY }}>
                {lang === 'ar' ? 'وجهان' : 'Recto-verso'}
              </span>
            )}
          </div>

          {/* Couleur sélectionnée */}
          {item.selectedColors?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs text-gray-400">
                {lang === 'ar' ? 'اللون:' : 'Couleur :'}{' '}
                <span className="font-semibold" style={{ color: NAVY }}>
                  {item.selectedColors[0]}
                </span>
              </span>
            </div>
          )}

          {/* Nombre de couleurs dans le design */}
          {item.numberOfColors != null && (
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'ar'
                ? `عدد ألوان التصميم: ${item.numberOfColors}`
                : `Couleurs dans le design : ${item.numberOfColors}`}
            </p>
          )}
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