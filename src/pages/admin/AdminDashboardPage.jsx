import { useState, useEffect, useRef } from 'react'
import {
  TrendingUp, Package, RefreshCcw, ShoppingBag,
  AlertTriangle, Loader2, EyeOff, Eye, Send, Phone,
  ImagePlus, Trash2, Star,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

/* ── Catégories disponibles (même enum que le modèle Product) ── */
const ALL_CATEGORIES = [
  { key: 'Board',        label: 'Boites' },
  { key: 'Bags',         label: 'Sacs' },
  { key: 'Autocollants', label: 'Cartes & Autocollants' },
  { key: 'Paper',        label: 'Papier' },
]

/* ── Carte de stat ── */
function StatCard({ icon: Icon, label, value, accent, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accent ? 'rgba(124,58,237,0.1)' : '#f3f4f6' }}>
          <Icon size={18} style={{ color: accent ? PURPLE : '#9ca3af' }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-1" style={{ color: color || NAVY }}>
        {value ?? '—'}
      </p>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      {accent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl" style={{ background: PURPLE }} />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   SECTION : Cacher des catégories
══════════════════════════════════════════════ */
function HiddenCategoriesSection() {
  const [hidden, setHidden]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    api.get('/admin/hidden-categories')
      .then(res => setHidden(res.data || []))
      .catch(() => toast.error('Erreur chargement catégories'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key) => {
    setHidden(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/admin/hidden-categories', { categories: hidden })
      toast.success('Visibilité mise à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          <EyeOff size={17} style={{ color: PURPLE }} />
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: NAVY }}>Cacher des catégories</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Les catégories cachées n'apparaissent plus pour les visiteurs
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {ALL_CATEGORIES.map(({ key, label }) => {
              const isHidden = hidden.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border-2
                             text-sm font-semibold transition-all"
                  style={{
                    borderColor: isHidden ? '#ef4444' : '#e5e7eb',
                    background:  isHidden ? '#fef2f2' : '#f9fafb',
                    color:       isHidden ? '#ef4444' : '#374151',
                  }}>
                  <span>{label}</span>
                  {isHidden
                    ? <EyeOff size={15} className="flex-shrink-0" style={{ color: '#ef4444' }} />
                    : <Eye    size={15} className="flex-shrink-0" style={{ color: '#9ca3af' }} />
                  }
                </button>
              )
            })}
          </div>

          {hidden.length > 0 && (
            <p className="text-xs text-red-400 mb-4 font-medium">
              {hidden.length} catégorie{hidden.length > 1 ? 's' : ''} cachée{hidden.length > 1 ? 's' : ''} aux visiteurs
            </p>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       text-white text-sm font-bold transition-all hover:opacity-90"
            style={{ background: PURPLE }}>
            {saving && <Loader2 size={13} className="animate-spin" />}
            Enregistrer la visibilité
          </button>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   SECTION : Avis clients (photos GitHub)
══════════════════════════════════════════════ */
const REVIEW_CATEGORIES = [
  { key: 'general',      label: 'Général (toutes pages)' },
  { key: 'Board',        label: 'Boites' },
  { key: 'Bags',         label: 'Sacs' },
  { key: 'Autocollants', label: 'Cartes & Autocollants' },
  { key: 'Paper',        label: 'Papier' },
]

function ReviewsSection() {
  const [reviews, setReviews]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [selectedCat, setSelectedCat] = useState('general')
  const [preview, setPreview]       = useState(null)
  const [imageB64, setImageB64]     = useState(null)
  const [filterCat, setFilterCat]   = useState('all')
  const fileInputRef                = useRef(null)

  const fetchReviews = () => {
    setLoading(true)
    api.get('/reviews')
      .then(res => setReviews(res.data || []))
      .catch(() => toast.error('Erreur chargement avis'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReviews() }, [])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier non supporté (images uniquement)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 Mo)')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      setImageB64(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!imageB64) return toast.error('Sélectionnez une image')
    setUploading(true)
    try {
      await api.post('/reviews', { imageBase64: imageB64, category: selectedCat })
      toast.success('Avis ajouté ✓')
      setPreview(null)
      setImageB64(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchReviews()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet avis ?')) return
    try {
      await api.delete(`/reviews/${id}`)
      toast.success('Avis supprimé')
      setReviews(prev => prev.filter(r => r._id !== id))
    } catch {
      toast.error('Erreur suppression')
    }
  }

  const displayed = filterCat === 'all'
    ? reviews
    : reviews.filter(r => r.category === filterCat)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          <Star size={17} style={{ color: PURPLE }} />
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: NAVY }}>Avis clients</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Photos uploadées sur GitHub — apparaissent dans le carrousel du site
          </p>
        </div>
      </div>

      {/* ── Upload ── */}
      <div className="rounded-xl border-2 border-dashed p-4 mb-5"
        style={{ borderColor: 'rgba(124,58,237,0.25)', background: '#faf9ff' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
          Ajouter une photo d'avis
        </p>

        {/* Sélection catégorie */}
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm
                     font-medium outline-none focus:border-purple-400 transition-colors"
          style={{ color: NAVY }}>
          {REVIEW_CATEGORIES.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        {/* Input fichier */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          id="review-file-input"
        />

        {preview ? (
          <div className="flex gap-3 items-start">
            <img src={preview} alt="Aperçu"
              className="w-24 h-24 object-cover rounded-xl border-2"
              style={{ borderColor: 'rgba(124,58,237,0.3)' }} />
            <div className="flex flex-col gap-2 flex-1">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl
                           text-white text-sm font-bold transition-all hover:opacity-90"
                style={{ background: PURPLE }}>
                {uploading
                  ? <><Loader2 size={13} className="animate-spin" /> Upload en cours…</>
                  : <><ImagePlus size={13} /> Envoyer sur GitHub</>
                }
              </button>
              <button
                onClick={() => { setPreview(null); setImageB64(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="w-full py-2 rounded-xl border-2 border-gray-200 text-gray-500
                           text-xs font-semibold hover:bg-gray-50 transition-all">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor="review-file-input"
            className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer
                       rounded-xl transition-all hover:opacity-80"
            style={{ background: 'rgba(124,58,237,0.04)' }}>
            <ImagePlus size={24} style={{ color: PURPLE }} />
            <span className="text-sm font-semibold" style={{ color: NAVY }}>
              Cliquer pour choisir une image
            </span>
            <span className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo</span>
          </label>
        )}
      </div>

      {/* ── Filtre catégorie ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[{ key: 'all', label: 'Tous' }, ...REVIEW_CATEGORIES].map(c => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: filterCat === c.key ? PURPLE : '#f3f4f6',
              color:      filterCat === c.key ? 'white'  : '#6b7280',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Grille des avis ── */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 size={14} className="animate-spin" /> Chargement…
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Aucun avis dans cette catégorie</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {displayed.map(review => (
            <div key={review._id} className="relative group rounded-xl overflow-hidden"
              style={{ aspectRatio: '4/5' }}>
              <img
                src={review.imageUrl}
                alt="Avis"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Badge catégorie */}
              <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5
                               rounded-full text-white"
                style={{ background: 'rgba(124,58,237,0.85)' }}>
                {REVIEW_CATEGORIES.find(c => c.key === review.category)?.label?.split(' ')[0] || review.category}
              </span>
              {/* Bouton supprimer */}
              <button
                onClick={() => handleDelete(review._id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                style={{ background: '#ef4444' }}>
                <Trash2 size={11} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        {reviews.length} photo{reviews.length !== 1 ? 's' : ''} au total
      </p>
    </div>
  )
}

/* ══════════════════════════════════════════════
   SECTION : Signaler un numéro
══════════════════════════════════════════════ */
function SignalerSection() {
  const [phone, setPhone]       = useState('')
  const [sending, setSending]   = useState(false)

  /* Configuration initiale du chat Telegram (à faire une seule fois) */
  const discoverTelegram = async () => {
    try {
      const res = await api.get('/admin/telegram/discover')
      toast.success(`Chat ID configuré : ${res.data.chatId}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur découverte Telegram')
    }
  }

  const signaler = async () => {
    if (!phone.trim()) return toast.error('Entrez un numéro')
    setSending(true)
    try {
      await api.post('/admin/signaler', { phone: phone.trim() })
      toast.success('Numéro signalé sur Telegram ✓')
      setPhone('')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur envoi'
      toast.error(msg)
      /* Si le chat n'est pas encore configuré, propose la configuration */
      if (err?.response?.status === 503) {
        toast('Configurez d\'abord Telegram via le bouton "Configurer Telegram"', {
          icon: 'ℹ️', duration: 5000,
        })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)' }}>
          <Send size={17} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: NAVY }}>Signaler un numéro</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Envoi immédiat sur votre bot Telegram
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && signaler()}
            placeholder="0xxxxxxxxx"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200
                       text-sm font-medium outline-none focus:border-purple-400 transition-colors"
            style={{ color: NAVY }}
          />
        </div>
        <button
          onClick={signaler}
          disabled={sending || !phone.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm
                     font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#ef4444' }}>
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Signaler
        </button>
      </div>

      {/* Bouton de configuration Telegram (à utiliser une seule fois) */}
      <button
        onClick={discoverTelegram}
        className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
        Configurer Telegram (à faire une seule fois)
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════ */
function AdminDashboardPage() {
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [resetting, setResetting]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch { toast.error('Erreur statistiques') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const handleReset = async () => {
    setResetting(true)
    try {
      await api.post('/admin/stats/reset')
      toast.success('Statistiques réinitialisées')
      setShowConfirm(false)
      await fetchStats()
    } catch { toast.error('Erreur réinitialisation') }
    finally { setResetting(false) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>Vue d'ensemble</p>
          <h1 className="text-3xl font-black italic" style={{ color: NAVY }}>Dashboard</h1>
        </div>
        <button onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200
                     text-sm font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all">
          <RefreshCcw size={14} /> Réinitialiser les stats
        </button>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Chiffre d'affaires (confirmés)"
            value={stats?.totalRevenue != null ? `${stats.totalRevenue.toLocaleString('fr-DZ')} DA` : '—'}
            color="#059669" accent />
          <StatCard icon={ShoppingBag} label="Total commandes"  value={stats?.totalOrders} />
          <StatCard icon={Package}     label="Confirmées"        value={stats?.confirmedOrders}  color="#10b981" />
          <StatCard icon={RefreshCcw}  label="Annulées"          value={stats?.cancelledOrders}  color="#ef4444" />
        </div>
      )}

      {/* Répartition */}
      {stats && !loading && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
            Répartition des commandes
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'En attente', count: stats.pendingOrders,   color: '#9ca3af', bg: '#f3f4f6' },
              { label: 'Confirmé',   count: stats.confirmedOrders, color: '#10b981', bg: '#ecfdf5' },
              { label: 'Annulé',     count: stats.cancelledOrders, color: '#ef4444', bg: '#fef2f2' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className="text-center p-4 rounded-2xl" style={{ background: bg }}>
                <p className="text-3xl font-black mb-1" style={{ color }}>{count ?? 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sections : Avis + Cacher + Signaler ── */}
      <ReviewsSection />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HiddenCategoriesSection />
        <SignalerSection />
      </div>

      {/* Modal reset */}
      {showConfirm && (
        <div className="fixed z-50 flex items-center justify-center p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: 'rgba(30,27,75,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <h3 className="font-black text-base" style={{ color: NAVY }}>Confirmation</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Cette action supprimera toutes les commandes{' '}
              <span className="text-red-500 font-bold">annulées</span>.
            </p>
            <p className="text-xs text-gray-400 mb-6">Cette opération est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={handleReset} disabled={resetting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                           text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: PURPLE }}>
                {resetting && <Loader2 size={14} className="animate-spin" />}
                Confirmer
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500
                           font-semibold text-sm hover:bg-gray-50 transition-all">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
