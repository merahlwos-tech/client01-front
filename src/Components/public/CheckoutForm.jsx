import { useState, useCallback } from 'react'
import { ChevronDown, User, Phone, MapPin, Map, Loader2, Package, Image, X, FileText } from 'lucide-react'
import wilayas from '../../data/wilayas'
import { useLang } from '../../context/LanguageContext'
import { uploadToCloudinary } from '../../utils/uploadCloudinary'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

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

function CheckoutForm({ onSubmit, loading }) {
  const { t, isRTL, lang } = useLang()
  const [form, setForm]         = useState({ firstName: '', lastName: '', phone: '', wilaya: '', commune: '', description: '' })
  const [errors, setErrors]     = useState({})
  const [logoFiles, setLogoFiles]   = useState([])
  const [logoUrls, setLogoUrls]     = useState([])
  const [uploading, setUploading]   = useState(false)

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
    if (!form.wilaya)             e.wilaya      = t('errorWilaya')
    if (!form.commune.trim())     e.commune     = t('errorCommune')
    if (logoUrls.length === 0)    e.logo        = t('errorLogo')
    if (!form.description.trim()) e.description = t('errorDesc')
    return e
  }

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(p  => ({ ...p,  [name]: value }))
    setErrors(p => ({ ...p, [name]: ''    }))
  }, [])

  const handleLogoSelect = async (files) => {
    if (!files?.length) return
    // Silently ignore if already at 2
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
    // Supprimer du state immédiatement (UX fluide)
    setLogoFiles(p => p.filter((_, i) => i !== idx))
    setLogoUrls(p  => p.filter((_, i) => i !== idx))
    // Supprimer de Cloudinary en arrière-plan
    if (urlToDelete) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload/logo`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToDelete }),
        })
      } catch (err) {
        console.error('Cloudinary logo delete error:', err.message)
      }
    }
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit({ ...form, logoUrls })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
        <Field label={t('firstName')} icon={User} error={errors.firstName}>
          <input type="text" name="firstName" value={form.firstName}
            onChange={handleChange} autoComplete="given-name"
            className={inputCls(errors.firstName)} />
        </Field>
        <Field label={t('lastName')} icon={User} error={errors.lastName}>
          <input type="text" name="lastName" value={form.lastName}
            onChange={handleChange} autoComplete="family-name"
            className={inputCls(errors.lastName)} />
        </Field>
      </div>

      {/* Téléphone */}
      <Field label={t('phone')} icon={Phone} error={errors.phone}>
        <input type="tel" name="phone" value={form.phone}
          onChange={handleChange} placeholder="0551234567"
          autoComplete="tel" inputMode="numeric"
          className={inputCls(errors.phone)} />
      </Field>

      {/* Wilaya */}
      <Field label={t('wilaya')} icon={Map} error={errors.wilaya}>
        <div className="relative">
          <select name="wilaya" value={form.wilaya} onChange={handleChange}
            className={`${inputCls(errors.wilaya)} appearance-none pr-10 cursor-pointer`}>
            <option value="">{t('selectWilaya')}</option>
            {wilayas.map(w => (
              <option key={w.code} value={w.name}>{w.code} — {w.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: PURPLE }} />
        </div>
      </Field>

      {/* Commune */}
      <Field label={t('commune')} icon={MapPin} error={errors.commune}>
        <input type="text" name="commune" value={form.commune}
          onChange={handleChange} autoComplete="address-level2"
          className={inputCls(errors.commune)} />
      </Field>

      {/* Logo */}
      <Field label={t('logoPhotos')} icon={Image} error={errors.logo}>
        {/* Aperçu */}
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

        {/* Zone upload — cachée silencieusement si 2 photos atteintes */}
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

      {/* Description */}
      <Field label={t('description')} icon={FileText} error={errors.description}>
        <textarea name="description" value={form.description}
          onChange={handleChange} rows={3}
          placeholder={t('descPlaceholder')}
          className={`${inputCls(errors.description)} resize-none`} />
      </Field>

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