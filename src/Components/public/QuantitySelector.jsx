import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, TrendingDown } from 'lucide-react'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const GREEN  = '#16a34a'

const QTY_OPTIONS = [100,200,300,400,500,600,700,800,900,1000,2000,3000]

/*
  priceTiers : [{ qty: 200, price: 12 }, { qty: 500, price: 10 }]
  baseUnitPrice : prix de base (taille sélectionnée + options)
  extraPerUnit  : montant des options (couleurs, double face) déjà inclus dans baseUnitPrice
                  → on applique les paliers uniquement sur le prix "taille", pas sur les options
*/
function getPriceForQty(qty, baseUnitPrice, sizePrice, priceTiers = []) {
  if (!priceTiers.length) return baseUnitPrice
  // Trie par qty croissant, trouve le palier applicable
  const sorted = [...priceTiers].sort((a, b) => a.qty - b.qty)
  let tierPrice = sizePrice  // prix taille de base
  for (const t of sorted) {
    if (qty >= t.qty) tierPrice = t.price
  }
  // Les extras (couleurs, double face) restent constants
  const extras = baseUnitPrice - sizePrice
  return tierPrice + extras
}

function QuantitySelector({ value, onChange, baseUnitPrice = 0, sizePrice = 0, priceTiers = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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
    <div ref={ref} className="relative w-full" style={{ minWidth: 0 }}>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all"
        style={{
          borderColor: open ? PURPLE : 'rgba(124,58,237,0.3)',
          color: NAVY, background: 'white',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
        }}>
        <span>{value.toLocaleString('fr-DZ')} unités</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentUnitPrice > 0 && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
              {currentTotal.toLocaleString('fr-DZ')} DA
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
              Plus vous commandez, moins c'est cher
            </div>
          )}
          <div className="max-h-64 overflow-y-auto py-1">
            {QTY_OPTIONS.map(q => {
              const uPrice   = getPriceForQty(q, baseUnitPrice, sizePrice, priceTiers)
              const total    = uPrice * q
              const baseTotal = baseUnitPrice * q
              const saving   = hasTiers ? baseTotal - total : 0
              const isActive = value === q
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

                  {/* Gauche : quantité + badge économie */}
                  <div className="flex items-center gap-2">
                    <span>{q.toLocaleString('fr-DZ')} unités</span>
                    {isCheaper && (
                      <span className="flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(22,163,74,0.1)', color: GREEN }}>
                        <TrendingDown size={9} />
                        -{(baseUnitPrice - uPrice).toLocaleString('fr-DZ')} DA/u
                      </span>
                    )}
                  </div>

                  {/* Droite : total + prix unitaire */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {baseUnitPrice > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-black leading-none"
                          style={{ color: isCheaper ? GREEN : (isActive ? PURPLE : '#6b7280') }}>
                          {total.toLocaleString('fr-DZ')} DA
                        </p>
                        {isCheaper && (
                          <p className="text-[10px] line-through text-gray-400 leading-none mt-0.5">
                            {baseTotal.toLocaleString('fr-DZ')} DA
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                          {uPrice.toLocaleString('fr-DZ')} DA/u
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

export { getPriceForQty }
export default QuantitySelector
