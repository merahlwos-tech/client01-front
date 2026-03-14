import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, User, Phone, MapPin, Map, Loader2, Package, Image, X, FileText, Store, Truck } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'
import { uploadToCloudinary } from '../../utils/uploadCloudinary'
import { trackFormEngagement } from '../../utils/metaPixel'
import { wilayas as LOCAL_WILAYAS } from '../../data/wilayas'
import toast from 'react-hot-toast'

// Convertit les wilayas locales au format attendu par le composant
const LOCAL_WILAYAS_FORMATTED = LOCAL_WILAYAS.map(w => ({
  wilaya_id: w.code,
  wilaya_name: w.name,
}))

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const API    = import.meta.env.VITE_API_URL || ''

/* ── sessionStorage cache helper ── */
function ssGet(key) { try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null } }
function ssSet(key, val) { try { sessionStorage.setItem(key, JSON.stringify(val)) } catch {} }

/* ── useEcotrackData hook ── */
function useEcotrackData() {
  const [wilayas, setWilayas]       = useState([])
  const [fees, setFees]             = useState([])
  const [communes, setCommunes]     = useState([])
  const [loadingW, setLoadingW]     = useState(false)
  const [loadingC, setLoadingC]     = useState(false)
  const [wilayaId, setWilayaIdState] = useState('')

  // Fetch wilayas + fees once
  useEffect(() => {
    const cachedW = ssGet('eco_wilayas_v2')
    const cachedF = ssGet('eco_fees_v2')
    if (cachedW?.length && cachedF) { setWilayas(cachedW); setFees(cachedF); return }

    setLoadingW(true)
    Promise.all([
      fetch(`${API}/ecotrack/wilayas`).then(r => r.json()).catch(() => null),
      fetch(`${API}/ecotrack/fees`).then(r => r.json()).catch(() => null),
    ]).then(([w, f]) => {
      let wList = Array.isArray(w) ? w : (w?.data || [])
      if (!wList.length) {
        console.warn('ECOTRACK indisponible — données locales utilisées')
        wList = LOCAL_WILAYAS_FORMATTED
      }
      const fList = Array.isArray(f) ? f : (f?.livraison || f?.data || [])
      const sorted = [...wList].sort((a, b) => Number(a.wilaya_id) - Number(b.wilaya_id))
      setWilayas(sorted); ssSet('eco_wilayas_v2', sorted)
      setFees(fList);     ssSet('eco_fees_v2', fList)
    }).catch(err => {
      console.error('ECOTRACK wilayas/fees:', err)
      setWilayas(LOCAL_WILAYAS_FORMATTED)
    }).finally(() => setLoadingW(false))
  }, [])

  // Fetch communes when wilaya changes
  const loadCommunes = useCallback((id) => {
    if (!id) { setCommunes([]); setWilayaIdState(''); return }
    setWilayaIdState(id)
    const cacheKey = `eco_communes_v2_${id}`
    const cached = ssGet(cacheKey)
    if (cached) { setCommunes(cached); return }

    setLoadingC(true)
    fetch(`${API}/ecotrack/communes?wilaya_id=${id}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        const sorted = [...list].sort((a, b) => a.nom?.localeCompare(b.nom))
        setCommunes(sorted); ssSet(cacheKey, sorted)
      }).catch(err => console.error('ECOTRACK communes:', err))
        .finally(() => setLoadingC(false))
  }, [])

  const getFeesForWilaya = useCallback((id) => {
    return fees.find(f => String(f.wilaya_id) === String(id)) || null
  }, [fees])

  return { wilayas, communes, loadingW, loadingC, wilayaId, loadCommunes, getFeesForWilaya }
}

/* ── Field wrapper ── */
function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: NAVY }}>
        {Icon && <Icon size={12} style={{ color: PURPLE }} />}
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-red-500 text-xs">⚠ {error}</p>}
    </div>
  )
}

/* ── Main component ── */
function CheckoutForm({ onSubmit, loading, onDeliveryChange, isFreeDelivery }) {
  const { t, isRTL, lang } = useLang()
  const [form, setForm]   = useState({ firstName: '', lastName: '', phone: '', wilayaId: '', wilayaName: '', commune: '', stopDesk: false, description: '' })
  const [errors, setErrors] = useState({})
  const [logoFiles, setLogoFiles] = useState([])
  const formEngagementFired = useRef(false)
  const [logoUrls, setLogoUrls] = useState([])
  const [uploading, setUploading] = useState(false)

  // Refs pour scroll-to-error
  const fieldRefs = useRef({})
  const setFieldRef = (key) => (el) => { if (el) fieldRefs.current[key] = el }

  const { wilayas, communes, loadingW, loadingC, loadCommunes, getFeesForWilaya } = useEcotrackData()

  const currentFees = form.wilayaId ? getFeesForWilaya(form.wilayaId) : null
  const deliveryFee = currentFees ? Number(form.stopDesk ? currentFees.tarif_stopdesk : currentFees.tarif) : null

  // Notify parent in real-time when delivery info changes
  useEffect(() => {
    if (onDeliveryChange) {
      onDeliveryChange({
        fee: deliveryFee ?? null,
        method: form.stopDesk ? 'Stop Desk' : 'Domicile',
      })
    }
  }, [deliveryFee, form.stopDesk])
  const hasStopDesk = communes.some(c => c.has_stop_desk === 1)
  const visibleCommunes = form.stopDesk ? communes.filter(c => c.has_stop_desk === 1) : communes

  const inputCls = err =>
    `w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all bg-white
     ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-purple-100'}`

  const validate = () => {
    const e = {}
    if (!form.firstName.trim())   e.firstName   = t('errorFirstName')
    if (!form.lastName.trim())    e.lastName    = t('errorLastName')
    if (!form.phone.trim())       e.phone       = t('errorPhone')
    else if (!/^(0)(5|6|7)\d{8}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = t('errorPhoneFormat')
    if (!form.wilayaId)           e.wilaya      = t('errorWilaya')
    if (!form.commune)            e.commune     = t('errorCommune')
    if (logoUrls.length === 0)    e.logo        = t('errorLogo')
    if (!form.description.trim()) e.description = t('errorDesc')
    return e
  }

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(p  => ({ ...p, [name]: value }))
    setErrors(p => ({ ...p, [name]: '' }))
  }, [])

  const handleWilayaChange = useCallback(e => {
    const selected = e.target.options[e.target.selectedIndex]
    const id   = e.target.value
    const name = selected?.dataset?.name || ''
    setForm(p => ({ ...p, wilayaId: id, wilayaName: name, commune: '', stopDesk: false }))
    setErrors(p => ({ ...p, wilaya: '', commune: '' }))
    loadCommunes(id)
  }, [loadCommunes])

  const handleStopDesk = useCallback((val) => {
    setForm(p => ({ ...p, stopDesk: val, commune: '' }))
    setErrors(p => ({ ...p, commune: '' }))
  }, [])

  const handleLogoSelect = async (files) => {
    if (!files?.length) return
    const remaining = 2 - logoFiles.length
    if (remaining <= 0) return
    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const uploaded = await Promise.all(toUpload.map(uploadToCloudinary))
      setLogoFiles(p => [...p, ...toUpload])
      setLogoUrls(p  => [...p, ...uploaded])
      setErrors(p => ({ ...p, logo: '' }))
    } catch (err) {
      console.error('Cloudinary upload error:', err)
      const isConfigError = err?.message?.includes('env') || err?.message?.includes('missing')
      const msg = isConfigError
        ? (lang === 'ar' ? 'خطأ في الإعداد — تحقق من VITE_CLOUDINARY_*' : 'Config Cloudinary manquante (.env)')
        : (lang === 'ar' ? 'فشل رفع الصورة، حاول مجدداً' : "Échec de l'upload — " + (err?.message || 'réessayez'))
      setErrors(p => ({ ...p, logo: msg }))
      toast.error(msg)
    } finally { setUploading(false) }
  }

  const removeLogo = async idx => {
    const urlToDelete = logoUrls[idx]
    setLogoFiles(p => p.filter((_, i) => i !== idx))
    setLogoUrls(p  => p.filter((_, i) => i !== idx))
    if (urlToDelete) {
      try {
        await fetch(`${API}/api/upload/logo`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToDelete }),
        })
      } catch (err) { console.error('Cloudinary logo delete error:', err.message) }
    }
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Scroll vers le premier champ en erreur
      const order = ['firstName', 'lastName', 'phone', 'wilaya', 'commune', 'logo', 'description']
      const firstErr = order.find(k => errs[k])
      if (firstErr && fieldRefs.current[firstErr]) {
        fieldRefs.current[firstErr].scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = fieldRefs.current[firstErr].querySelector('input,select,textarea')
        if (input) setTimeout(() => input.focus(), 350)
      }
      return
    }
    onSubmit({
      ...form,
      wilaya:          form.wilayaName,
      wilayaCode:      form.wilayaId ? Number(form.wilayaId) : null,
      deliveryMethod:  form.stopDesk ? 'Stop Desk' : 'Domicile',
      deliveryFee:     isFreeDelivery ? 0 : deliveryFee,
      logoUrls,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Livraison gratuite badge */}
      {isFreeDelivery && (
        <div className="rounded-xl px-4 py-2.5 text-center text-sm font-bold"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.4)', color: '#065f46' }}>
          {t('freeDelivery')}
        </div>
      )}

      {/* Prénom + Nom */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
        <div ref={setFieldRef('firstName')}>
          <Field label={t('firstName')} icon={User} error={errors.firstName}>
            <input type="text" name="firstName" value={form.firstName}
              onChange={handleChange} autoComplete="given-name"
              onFocus={() => {
                if (!formEngagementFired.current) {
                  formEngagementFired.current = true
                  trackFormEngagement()
                }
              }}
              className={inputCls(errors.firstName)} />
          </Field>
        </div>
        <div ref={setFieldRef('lastName')}>
          <Field label={t('lastName')} icon={User} error={errors.lastName}>
            <input type="text" name="lastName" value={form.lastName}
              onChange={handleChange} autoComplete="family-name"
              className={inputCls(errors.lastName)} />
          </Field>
        </div>
      </div>

      {/* Téléphone */}
      <div ref={setFieldRef('phone')}>
        <Field label={t('phone')} icon={Phone} error={errors.phone}>
          <input type="tel" name="phone" value={form.phone}
            onChange={handleChange} placeholder="0551234567"
            autoComplete="tel" inputMode="numeric"
            className={inputCls(errors.phone)} />
        </Field>
      </div>

      {/* Wilaya */}
      <div ref={setFieldRef('wilaya')}>
        <Field label={t('wilaya')} icon={Map} error={errors.wilaya}>
          <div className="relative">
            {loadingW
              ? <div className={`${inputCls(false)} flex items-center gap-2 text-gray-400`}>
                  <Loader2 size={14} className="animate-spin" /> Chargement des wilayas…
                </div>
              : <>
                  <select value={form.wilayaId} onChange={handleWilayaChange}
                    className={`${inputCls(errors.wilaya)} appearance-none pr-10 cursor-pointer`}>
                    <option value="">{t('selectWilaya')}</option>
                    {wilayas.map(w => (
                      <option key={w.wilaya_id} value={w.wilaya_id} data-name={w.wilaya_name}>
                        {w.wilaya_id} — {w.wilaya_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: PURPLE }} />
                </>
            }
          </div>
        </Field>
      </div>

      {/* Stop desk toggle */}
      {form.wilayaId && (
        <div className="flex gap-2">
          <button type="button"
            onClick={() => handleStopDesk(false)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
            style={!form.stopDesk ? {
              borderColor: '#7c3aed', background: '#7c3aed', color: 'white',
              boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            } : { borderColor: '#e5e7eb', background: 'white', color: '#9ca3af' }}>
            <Truck size={18} />
            <span>À domicile</span>
            {currentFees && (
              <span className="text-xs font-black"
                style={{ color: !form.stopDesk ? 'rgba(255,255,255,0.9)' : '#d1d5db' }}>
                {Number(currentFees.tarif).toLocaleString('fr-DZ')} DA
              </span>
            )}
          </button>
          <button type="button"
            onClick={() => handleStopDesk(true)}
            disabled={!hasStopDesk && communes.length > 0}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={form.stopDesk ? {
              borderColor: '#7c3aed', background: '#7c3aed', color: 'white',
              boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            } : { borderColor: '#e5e7eb', background: 'white', color: '#9ca3af' }}>
            <Store size={18} />
            <span>Stop Desk</span>
            {currentFees && !isFreeDelivery && (
              <span className="text-xs font-black"
                style={{ color: form.stopDesk ? 'rgba(255,255,255,0.9)' : '#d1d5db' }}>
                {Number(currentFees.tarif_stopdesk).toLocaleString('fr-DZ')} DA
              </span>
            )}
            {isFreeDelivery && form.stopDesk && (
              <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {lang === 'ar' ? 'مجاني 🎉' : 'Gratuit 🎉'}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Commune */}
      <div ref={setFieldRef('commune')}>
        <Field label={t('commune')} icon={MapPin} error={errors.commune}>
          <div className="relative">
            {loadingC
              ? <div className={`${inputCls(false)} flex items-center gap-2 text-gray-400`}>
                  <Loader2 size={14} className="animate-spin" /> Chargement des communes…
                </div>
              : !form.wilayaId
                ? <input type="text" disabled placeholder={t('selectWilaya')}
                    className={`${inputCls(false)} opacity-50 cursor-not-allowed`} />
                : form.stopDesk && !hasStopDesk && communes.length > 0
                  ? <p className="text-sm text-amber-600 px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-200">
                      Pas de stop desk disponible dans cette wilaya.
                    </p>
                  : <>
                      <select name="commune" value={form.commune} onChange={handleChange}
                        className={`${inputCls(errors.commune)} appearance-none pr-10 cursor-pointer`}>
                        <option value="">— Choisir une commune —</option>
                        {visibleCommunes.map(c => (
                          <option key={c.nom} value={c.nom}>{c.nom}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: PURPLE }} />
                    </>
            }
          </div>
        </Field>
      </div>

      {/* Frais de livraison */}
      {!isFreeDelivery && deliveryFee != null && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-purple-50 border border-purple-200 text-sm">
          <span className="text-gray-600 font-medium">Frais de livraison</span>
          <span className="font-black text-purple-700 text-base">{deliveryFee} DA</span>
        </div>
      )}

      {/* Logo */}
      <div ref={setFieldRef('logo')}>
        <Field label={t('logoPhotos')} icon={Image} error={errors.logo}>
          {logoFiles.length > 0 && (
            <div className="flex gap-2 mb-3">
              {logoFiles.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2"
                  style={{ borderColor: PURPLE }}>
                  <img src={URL.createObjectURL(file)} alt="logo"
                    className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeLogo(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full
                               flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {logoFiles.length < 2 && (
            <label className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl
                              border-2 border-dashed cursor-pointer transition-all text-sm font-medium
                              ${uploading ? 'opacity-60 pointer-events-none' : 'hover:border-purple-400 hover:bg-purple-50'}`}
              style={{ borderColor: errors.logo ? '#fca5a5' : 'rgba(124,58,237,0.3)', color: PURPLE }}>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleLogoSelect(e.target.files)} />
              {uploading
                ? <><Loader2 size={16} className="animate-spin" /> {t('processing')}</>
                : <><Image size={16} /> {t('logoPhotos').split('(')[0].trim()}</>}
            </label>
          )}
        </Field>
      </div>

      {/* Description */}
      <div ref={setFieldRef('description')}>
        <Field label={t('description')} icon={FileText} error={errors.description}>
          <textarea name="description" value={form.description}
            onChange={handleChange} rows={3}
            placeholder={t('descPlaceholder')}
            className={`${inputCls(errors.description)} resize-none`} />
        </Field>
      </div>

      {/* Bouton */}
      <button type="submit" disabled={loading || uploading}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                   text-white font-black text-base transition-all hover:opacity-90
                   disabled:opacity-60 shadow-lg mt-2"
        style={{ background: loading ? '#9ca3af' : PURPLE }}>
        {loading
          ? <><Loader2 size={20} className="animate-spin" /> {t('processing')}</>
          : <><Package size={20} /> {t('confirmOrder')}</>}
      </button>
    </form>
  )
}

export default CheckoutForm