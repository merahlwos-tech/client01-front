import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Loader2, CheckCircle2,
  Phone, MapPin, User, Package, FileText, Tag, Hash
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const STATUS_OPTIONS = [
  { value: 'en attente',   label: 'En attente',   color: '#9ca3af', bg: '#f3f4f6' },
  { value: 'confirmé',     label: 'Confirmé',     color: '#3b82f6', bg: '#eff6ff' },
  { value: 'en livraison', label: 'En livraison', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'livré',        label: 'Livré',        color: '#10b981', bg: '#ecfdf5' },
  { value: 'retour',       label: 'Retour',       color: '#f97316', bg: '#fff7ed' },
  { value: 'annulé',       label: 'Annulé',       color: '#ef4444', bg: '#fef2f2' },
]

const STATUS_LABELS = {
  'en attente': 'En attente', confirmé: 'Confirmé',
  'en livraison': 'En livraison', livré: 'Livré', retour: 'Retour', annulé: 'Annulé',
}

function InfoBlock({ icon: Icon, label, children, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </span>
      <span
        className="font-semibold text-sm"
        style={{ color: highlight ? PURPLE : NAVY }}>
        {children}
      </span>
    </div>
  )
}

export default function AdminOrderDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [order, setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/orders/${id}`)
        setOrder(res.data)
        setStatus(res.data.status)
      } catch {
        toast.error('Commande introuvable')
        navigate('/admin/orders', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/orders/${id}`, { status })
      setOrder(prev => ({ ...prev, status }))
      setDirty(false)
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const downloadLogo = async (url, idx) => {
    try {
      const res  = await fetch(url)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `logo-${id}-${idx + 1}.jpg`
      a.click()
    } catch {
      toast.error('Erreur téléchargement')
    }
  }

  /* ─── Loading ─── */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: PURPLE }} />
    </div>
  )

  if (!order) return null

  const currentOpt = STATUS_OPTIONS.find(o => o.value === status)
  const createdAt  = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">

      {/* ── Breadcrumb / Back ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'white', color: NAVY, border: '1.5px solid #e5e7eb', boxShadow: '0 1px 4px rgba(30,27,75,0.06)' }}>
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Commande</p>
            <h1 className="text-xl sm:text-2xl font-black italic" style={{ color: NAVY }}>
              #{order._id.slice(-6).toUpperCase()}
            </h1>
          </div>
        </div>

        {/* Status badge */}
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: currentOpt?.bg, color: currentOpt?.color, border: `1.5px solid ${currentOpt?.color}30` }}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* ── Grid principal : 2 colonnes sur desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Colonne gauche (lg: 2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Client */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <User size={14} style={{ color: PURPLE }} />
              </div>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                Informations client
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              <InfoBlock label="Nom" icon={User}>
                {order.customerInfo.firstName} {order.customerInfo.lastName}
              </InfoBlock>
              <InfoBlock label="Téléphone" icon={Phone} highlight>
                <a href={`tel:${order.customerInfo.phone}`} style={{ color: PURPLE }}>
                  {order.customerInfo.phone}
                </a>
              </InfoBlock>
              <InfoBlock label="Wilaya" icon={MapPin}>
                {order.customerInfo.wilaya}
              </InfoBlock>
              <InfoBlock label="Commune" icon={MapPin}>
                {order.customerInfo.commune}
              </InfoBlock>
              {order.customerInfo.deliveryMethod && (
                <InfoBlock label="Livraison" icon={Truck}>
                  {order.customerInfo.deliveryMethod}
                </InfoBlock>
              )}
              {order.customerInfo.deliveryFee != null && (
                <InfoBlock label="Frais" icon={Package}>
                  {order.customerInfo.deliveryFee.toLocaleString('fr-DZ')} DA
                </InfoBlock>
              )}
            </div>

            {order.customerInfo.description && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={13} style={{ color: PURPLE }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>
                    Instructions
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  {order.customerInfo.description}
                </p>
              </div>
            )}
          </section>

          {/* Articles */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Package size={14} style={{ color: PURPLE }} />
              </div>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                Articles commandés
              </h2>
            </div>

            {/* Table desktop / cards mobile */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(124,58,237,0.04)', borderBottom: '1px solid #f3f4f6' }}>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Produit</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Taille</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Qté</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className="transition-colors hover:bg-purple-50/30"
                      style={{ borderBottom: i < order.items.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                      <td className="px-4 py-3">
                        <p className="font-bold" style={{ color: NAVY }}>{item.name}</p>
                        {item.doubleSided && (
                          <span className="text-[10px] font-bold text-purple-500">• Recto-verso</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.size || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(124,58,237,0.08)', color: PURPLE }}>
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black" style={{ color: PURPLE }}>
                        {(item.price * item.quantity).toLocaleString('fr-DZ')}
                        <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="sm:hidden space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate" style={{ color: NAVY }}>{item.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.size}
                      {item.doubleSided && <span className="ml-2 text-purple-500">• Recto-verso</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-gray-400">{item.quantity.toLocaleString()} u.</p>
                    <p className="font-black text-sm" style={{ color: PURPLE }}>
                      {(item.price * item.quantity).toLocaleString('fr-DZ')} DA
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            {order.customerInfo.deliveryFee != null && (
              <div className="flex items-center justify-between px-4 py-2 mt-3 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)' }}>
                <span className="text-sm text-gray-500">
                  Frais de livraison
                  {order.customerInfo.deliveryMethod && (
                    <span className="ml-1 text-xs text-purple-400">({order.customerInfo.deliveryMethod})</span>
                  )}
                </span>
                <span className="font-bold text-sm" style={{ color: NAVY }}>
                  {order.customerInfo.deliveryFee.toLocaleString('fr-DZ')} DA
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 mt-2 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <span className="font-bold text-sm" style={{ color: NAVY }}>Total commande</span>
              <span className="font-black text-2xl" style={{ color: PURPLE }}>
                {(order.total ?? 0).toLocaleString('fr-DZ')}
                <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
              </span>
            </div>
          </section>

          {/* Logos / fichiers client */}
          {order.customerInfo.logoUrls?.length > 0 && (
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <Tag size={14} style={{ color: PURPLE }} />
                </div>
                <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                  Fichiers client
                </h2>
              </div>
              <div className="flex gap-4 flex-wrap">
                {order.customerInfo.logoUrls.map((url, idx) => {
                  const isPdfUrl = url?.toLowerCase().includes('.pdf') || url?.includes('/raw/')
                  if (isPdfUrl) {
                    // Affichage PDF : carte avec icône + boutons ouvrir/télécharger
                    const filename = url.split('/').pop()?.split('?')[0] || `logo-${idx + 1}.pdf`
                    return (
                      <div key={idx}
                        className="flex flex-col items-center justify-between gap-2 p-3 rounded-xl border-2 w-28"
                        style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.03)' }}>
                        <FileText size={32} style={{ color: PURPLE }} />
                        <span className="text-[10px] text-gray-500 text-center leading-tight break-all line-clamp-2">
                          {filename.length > 18 ? filename.slice(0, 16) + '…' : filename}
                        </span>
                        <div className="flex gap-1.5 w-full">
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center py-1 rounded-lg text-[10px] font-bold text-white"
                            style={{ background: PURPLE }}>
                            Ouvrir
                          </a>
                          <button onClick={() => downloadLogo(url, idx)}
                            className="w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'rgba(124,58,237,0.12)', color: PURPLE }}>
                            <Download size={11} />
                          </button>
                        </div>
                      </div>
                    )
                  }
                  // Affichage image
                  return (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`logo ${idx + 1}`}
                        className="w-24 h-24 object-contain rounded-xl border-2 bg-gray-50 transition-transform group-hover:scale-105"
                        style={{ borderColor: 'rgba(124,58,237,0.2)' }}
                      />
                      <button
                        onClick={() => downloadLogo(url, idx)}
                        className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold shadow-md transition-transform hover:scale-110"
                        style={{ background: PURPLE }}>
                        <Download size={10} /> DL
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Colonne droite (lg: 1/3) ── */}
        <div className="space-y-4">

          {/* Métadonnées */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Hash size={14} style={{ color: PURPLE }} />
              </div>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                Détails
              </h2>
            </div>
            <div className="space-y-3">
              <InfoBlock label="Référence">
                #{order._id.slice(-6).toUpperCase()}
              </InfoBlock>
              <InfoBlock label="Date de commande">
                {createdAt}
              </InfoBlock>
              <InfoBlock label="Nombre d'articles">
                {order.items.reduce((acc, i) => acc + i.quantity, 0).toLocaleString()} unités
              </InfoBlock>
            </div>
          </section>

          {/* Changer le statut */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <CheckCircle2 size={14} style={{ color: PURPLE }} />
              </div>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                Statut
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatus(opt.value); setDirty(opt.value !== order.status) }}
                  className="py-2.5 px-2 rounded-xl text-[11px] font-bold border-2 transition-all text-center leading-tight"
                  style={{
                    background:  status === opt.value ? opt.color : 'white',
                    borderColor: status === opt.value ? opt.color : '#e5e7eb',
                    color:       status === opt.value ? 'white'   : opt.color,
                    boxShadow:   status === opt.value ? `0 4px 12px ${opt.color}40` : 'none',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, #6d28d9)`, boxShadow: `0 4px 16px rgba(124,58,237,0.35)` }}>
                {saving
                  ? <Loader2 size={14} className="animate-spin" />
                  : <CheckCircle2 size={14} />
                }
                Enregistrer le statut
              </button>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}