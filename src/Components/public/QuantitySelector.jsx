import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, TrendingDown } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const GREEN  = '#16a34a'

const QTY_OPTIONS = [100,200,300,400,500,600,700,800,900,1000,2000,3000]

export function getPriceForQty(qty, baseUnitPrice, sizePrice, priceTiers = []) {
  if (!priceTiers.length) return baseUnitPrice
  const sorted = [...priceTiers].sort((a, b) => a.qty - b.qty)
  let tierPrice = sizePrice
  for (const t of sorted) {
    if (qty >= t.qty) tierPrice = t.price
  }
  const extras = baseUnitPrice - sizePrice
  return tierPrice + extras
}

function QuantitySelector({ value, onChange, baseUnitPrice = 0, sizePrice = 0, priceTiers = [] }) {
  const [open, setOpen] = useState(false)
  const { lang, isRTL } = useLang()
  const ref = useRef(null)

  const cur  = lang === 'ar' ? 'دج' : 'DA'
  const unit = lang === 'ar' ? 'وحدة' : 'unités'
  const cheaperLabel = lang === 'ar' ? 'كلما اشتريت أكثر، كلما كان السعر أقل' : 'Plus vous commandez, moins c\'est cher'

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = qty => { onChange(qty); setOpen(false) }

  const currentUnitPrice = getPriceForQty(value, baseUnitPrice, sizePrice, priceTiers)
  const currentTotal     = currentUnitPrice * value
  const hasTiers         = priceTiers.length > 0

  return (
    <div ref={ref} className="relative w-full" style={{ minWidth: 0 }} dir={isRTL ? 'rtl' : 'ltr'}>

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
              {currentTotal.toLocaleString('fr-DZ')} {cur}
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`}
            style={{ color: PURPLE }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: 'white',
            border: `2px solid rgba(124,58,237,0.2)`,
            boxShadow: '0 8px 32px rgba(124,58,237,0.15)',
            minWidth: 260,
          }}>
          {hasTiers && (
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b"
              style={{ color: PURPLE, borderColor: 'rgba(124,58,237,0.1)', background: 'rgba(124,58,237,0.03)' }}>
              {cheaperLabel}
            </div>
          )}
          <div className="max-h-64 overflow-y-auto py-1">
            {QTY_OPTIONS.map(q => {
              const uPrice    = getPriceForQty(q, baseUnitPrice, sizePrice, priceTiers)
              const total     = uPrice * q
              const baseTotal = baseUnitPrice * q
              const isActive  = value === q
              const isCheaper = hasTiers && uPrice < baseUnitPrice

              return (
                <button key={q} type="button" onClick={() => select(q)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-all"
                  style={{
                    background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                    color: isActive ? PURPLE : NAVY,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(124,58,237,0.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>

                  {/* Quantité + badge économie */}
                  <div className="flex items-center gap-2">
                    <span>{q.toLocaleString('fr-DZ')} {unit}</span>
                    {isCheaper && (
                      <span className="flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(22,163,74,0.1)', color: GREEN }}>
                        <TrendingDown size={9} />
                        -{(baseUnitPrice - uPrice).toLocaleString('fr-DZ')} {cur}/{lang === 'ar' ? 'و' : 'u'}
                      </span>
                    )}
                  </div>

                  {/* Total + prix unitaire */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {baseUnitPrice > 0 && (
                      <div className={isRTL ? 'text-left' : 'text-right'}>
                        <p className="text-xs font-black leading-none"
                          style={{ color: isCheaper ? GREEN : (isActive ? PURPLE : '#6b7280') }}>
                          {total.toLocaleString('fr-DZ')} {cur}
                        </p>
                        {isCheaper && (
                          <p className="text-[10px] line-through text-gray-400 leading-none mt-0.5">
                            {baseTotal.toLocaleString('fr-DZ')} {cur}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                          {uPrice.toLocaleString('fr-DZ')} {cur}/{lang === 'ar' ? 'و' : 'u'}
                        </p>
                      </div>
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

export default QuantitySelector
