import { useState, useCallback } from 'react'
import { ChevronDown, User, Phone, MapPin, Map, Loader2, Package } from 'lucide-react'
import wilayas from '../../data/wilayas'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const Field = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2"
      style={{ color: NAVY }}>
      <Icon size={12} style={{ color: PURPLE }} />
      {label}
    </label>
    {children}
    {error && <p className="mt-1.5 text-red-500 text-xs flex items-center gap-1">⚠ {error}</p>}
  </div>
)

function CheckoutForm({ onSubmit, loading }) {
  const [form, setForm]     = useState({ firstName: '', lastName: '', phone: '', wilaya: '', commune: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Prénom requis'
    if (!form.lastName.trim())  e.lastName  = 'Nom requis'
    if (!form.phone.trim())     e.phone     = 'Téléphone requis'
    else if (!/^(0)(5|6|7)\d{8}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Format invalide (ex: 0551234567)'
    if (!form.wilaya)           e.wilaya    = 'Wilaya requise'
    if (!form.commune.trim())   e.commune   = 'Commune requise'
    return e
  }

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(p  => ({ ...p,  [name]: value }))
    setErrors(p => ({ ...p, [name]: ''    }))
  }, [])

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(form)
  }

  const inputCls = err =>
    `w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all bg-white
     ${err
       ? 'border-red-300 bg-red-50 focus:border-red-400'
       : 'border-gray-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-purple-100'
     }`

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" icon={User} error={errors.firstName}>
          <input type="text" name="firstName" value={form.firstName}
            onChange={handleChange} placeholder="Amina" autoComplete="given-name"
            className={inputCls(errors.firstName)} />
        </Field>
        <Field label="Nom" icon={User} error={errors.lastName}>
          <input type="text" name="lastName" value={form.lastName}
            onChange={handleChange} placeholder="Benali" autoComplete="family-name"
            className={inputCls(errors.lastName)} />
        </Field>
      </div>

      {/* Téléphone */}
      <Field label="Téléphone" icon={Phone} error={errors.phone}>
        <input type="tel" name="phone" value={form.phone}
          onChange={handleChange} placeholder="0551234567"
          autoComplete="tel" inputMode="numeric"
          className={inputCls(errors.phone)} />
      </Field>

      {/* Wilaya */}
      <Field label="Wilaya" icon={Map} error={errors.wilaya}>
        <div className="relative">
          <select name="wilaya" value={form.wilaya} onChange={handleChange}
            className={`${inputCls(errors.wilaya)} appearance-none pr-10 cursor-pointer`}>
            <option value="">Sélectionner une wilaya</option>
            {wilayas.map(w => (
              <option key={w.code} value={w.name}>{w.code} — {w.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: PURPLE }} />
        </div>
      </Field>

      {/* Commune */}
      <Field label="Commune" icon={MapPin} error={errors.commune}>
        <input type="text" name="commune" value={form.commune}
          onChange={handleChange} placeholder="Votre commune"
          autoComplete="address-level2"
          className={inputCls(errors.commune)} />
      </Field>

      {/* Bouton */}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                   text-white font-black text-base transition-all hover:opacity-90
                   disabled:opacity-60 shadow-lg mt-2"
        style={{ background: loading ? '#9ca3af' : PURPLE }}>
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Traitement en cours...</>
        ) : (
          <><Package size={20} /> Confirmer la commande</>
        )}
      </button>
    </form>
  )
}

export default CheckoutForm