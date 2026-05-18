import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const QTY_OPTIONS = [100,200,300,400,500,600,700,800,900,1000,2000,3000]

export function getPriceForQty(qty, baseUnitPrice, sizePrice, priceTiers = []) {
  if (!priceTiers.length) return baseUnitPrice
  const sorted = [...priceTiers].sort((a, b) => a.qty - b.qty)
  let tierPrice = sizePrice
  for (const t of sorted) { if (qty >= t.qty) tierPrice = t.price }
  return tierPrice + (baseUnitPrice - sizePrice)
}

export default function QuantitySelector({ value, onChange, baseUnitPrice = 0, sizePrice = 0, priceTiers = [] }) {
  const [open, setOpen]  = useState(false)
  const { lang, isRTL }  = useLang()
  const ref              = useRef(null)

  const cur  = lang === 'ar' ? 'دج' : 'DA'
  const unit = lang === 'ar' ? 'وحدة' : 'unités'
  const perU = lang === 'ar' ? 'دج/و' : 'DA/u'

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const currentUnitPrice = getPriceForQty(value, baseUnitPrice, sizePrice, priceTiers)
  const hasTiers         = priceTiers.length > 0

  return (
    <div ref={ref} className="relative w-full" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all"
        style={{
          borderColor: open ? PURPLE : 'rgba(124,58,237,0.3)',
          color: NAVY, background: 'white',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
        }}>
        <span>{value.toLocaleString('fr-DZ')} {unit}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentUnitPrice > 0 && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
              {currentUnitPrice.toLocaleString('fr-DZ')} {perU}
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`}
            style={{ color: PURPLE }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{ background: 'white', border: '2px solid rgba(124,58,237,0.2)', boxShadow: '0 8px 32px rgba(124,58,237,0.15)', minWidth: 240 }}>

          {hasTiers && (
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b"
              style={{ color: PURPLE, borderColor: 'rgba(124,58,237,0.1)', background: 'rgba(124,58,237,0.03)' }}>
              {lang === 'ar' ? 'كلما اشتريت أكثر، كلما كان السعر أقل' : 'Plus vous commandez, moins c\'est cher'}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1">
            {QTY_OPTIONS.map(q => {
              const uPrice   = getPriceForQty(q, baseUnitPrice, sizePrice, priceTiers)
              const isActive = value === q

              return (
                <button key={q} type="button" onClick={() => { onChange(q); setOpen(false) }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-all"
                  style={{ background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent', color: isActive ? PURPLE : NAVY }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(124,58,237,0.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>

                  {/* Quantité */}
                  <span>{q.toLocaleString('fr-DZ')} {unit}</span>

                  {/* Prix unitaire — même couleur pour tous */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {baseUnitPrice > 0 && (
                      <span className="text-xs font-black" style={{ color: isActive ? PURPLE : NAVY }}>
                        {uPrice.toLocaleString('fr-DZ')} {perU}
                      </span>
                    )}
                    {isActive && <Check size={14} style={{ color: PURPLE }} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
