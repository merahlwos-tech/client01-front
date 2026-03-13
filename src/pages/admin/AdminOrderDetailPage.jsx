import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Loader2, CheckCircle2, Truck,
  Phone, MapPin, User, Package, FileText, Tag, Hash,
  Download, Pencil, Plus, Trash2, Save, X
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const API    = import.meta.env.VITE_API_URL || ''
const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const STATUS_OPTIONS = [
  { value: 'en attente', label: 'En attente', color: '#9ca3af', bg: '#f3f4f6' },
  { value: 'confirmé',   label: 'Confirmé',   color: '#10b981', bg: '#ecfdf5' },
  { value: 'annulé',     label: 'Annulé',     color: '#ef4444', bg: '#fef2f2' },
]

function InfoBlock({ icon: Icon, label, children, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </span>
      <span className="font-semibold text-sm" style={{ color: highlight ? PURPLE : NAVY }}>
        {children}
      </span>
    </div>
  )
}

export default function AdminOrderDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  // Edit mode
  const [editClient, setEditClient] = useState(false)
  const [clientForm, setClientForm] = useState({})
  const [items, setItems]           = useState([])
  const [status, setStatus]         = useState('')
  const [dirty, setDirty]           = useState(false)

  // Ecotrack wilaya/commune
  const [wilayas, setWilayas]       = useState([])
  const [communes, setCommunes]     = useState([])
  const [loadingW, setLoadingW]     = useState(false)
  const [loadingC, setLoadingC]     = useState(false)
  const [fees, setFees]             = useState([])

  // Add product modal
  const [addModal, setAddModal]     = useState(false)
  const [products, setProducts]     = useState([])
  const [newItem, setNewItem]       = useState({ productId: '', name: '', size: '', quantity: 1, price: 0 })
  const [selProduct, setSelProduct] = useState(null)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await api.get(`/orders/${id}`)
        setOrder(res.data)
        setStatus(res.data.status)
        setItems(res.data.items)
        setClientForm({
          firstName: res.data.customerInfo.firstName,
          lastName:  res.data.customerInfo.lastName,
          phone:     res.data.customerInfo.phone,
          wilaya:    res.data.customerInfo.wilaya,
          commune:   res.data.customerInfo.commune,
        })
      } catch {
        toast.error('Commande introuvable')
        navigate('/admin/orders', { replace: true })
      } finally { setLoading(false) }
    }
    fetch_()

    // Load wilayas + fees from Ecotrack
    setLoadingW(true)
    Promise.all([
      fetch(`${API}/ecotrack/wilayas`).then(r => r.json()).catch(() => []),
      fetch(`${API}/ecotrack/fees`).then(r => r.json()).catch(() => null),
    ]).then(([w, f]) => {
      const wList = Array.isArray(w) ? w : (w?.data || [])
      const fList = Array.isArray(f) ? f : (f?.livraison || f?.data || [])
      setWilayas([...wList].sort((a, b) => Number(a.wilaya_id) - Number(b.wilaya_id)))
      setFees(fList)
    }).finally(() => setLoadingW(false))
  }, [id])

  const computedTotal = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0)
    + Number(order?.customerInfo?.deliveryFee ?? 0)

  const loadCommunes = async (wilayaId) => {
    if (!wilayaId) { setCommunes([]); return }
    setLoadingC(true)
    try {
      const data = await fetch(`${API}/ecotrack/communes?wilaya_id=${wilayaId}`).then(r => r.json())
      const list = Array.isArray(data) ? data : (data?.data || [])
      setCommunes([...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || '')))
    } catch { setCommunes([]) }
    finally { setLoadingC(false) }
  }

  const handleWilayaChange = (wilayaId) => {
    const w = wilayas.find(w => String(w.wilaya_id) === String(wilayaId))
    setClientForm(p => ({ ...p, wilaya: w?.wilaya_name || wilayaId, wilayaId, commune: '' }))
    setDirty(true)
    loadCommunes(wilayaId)
  }

  const handleDeliveryMethodChange = (method) => {
    const wilayaId = clientForm.wilayaId || wilayas.find(w => w.wilaya_name === clientForm.wilaya)?.wilaya_id
    const fee = fees.find(f => String(f.wilaya_id) === String(wilayaId))
    const feeAmount = fee ? Number(method === 'Stop Desk' ? fee.tarif_stopdesk : fee.tarif) : null
    setClientForm(p => ({ ...p, deliveryMethod: method, deliveryFee: feeAmount }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        status,
        items: items.map(i => ({
          product:     i.product?._id || i.product,
          name:        i.name,
          size:        i.size,
          doubleSided: i.doubleSided,
          quantity:    Number(i.quantity),
          price:       Number(i.price),
        })),
        total: computedTotal,
        ...(editClient ? { customerInfo: { ...clientForm, deliveryMethod: clientForm.deliveryMethod || order.customerInfo.deliveryMethod, deliveryFee: clientForm.deliveryFee !== undefined ? clientForm.deliveryFee : order.customerInfo.deliveryFee } } : {}),
      }
      const res = await api.put(`/orders/${id}`, payload)
      setOrder(res.data)
      setItems(res.data.items)
      setDirty(false)
      setEditClient(false)
      toast.success('Commande mise à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  // Item helpers
  const updateQty = (idx, qty) => {
    if (qty < 1) return
    setItems(p => p.map((it, i) => i === idx ? { ...it, quantity: qty } : it))
    setDirty(true)
  }
  const removeItem = (idx) => {
    setItems(p => p.filter((_, i) => i !== idx))
    setDirty(true)
  }

  // Add product
  const openAddModal = async () => {
    if (!products.length) {
      try {
        const res = await api.get('/products')
        setProducts(res.data)
      } catch { toast.error('Erreur chargement produits') }
    }
    setNewItem({ productId: '', name: '', size: '', quantity: 1, price: 0 })
    setSelProduct(null)
    setAddModal(true)
  }

  const handleProductSelect = (e) => {
    const p = products.find(p => p._id === e.target.value)
    setSelProduct(p || null)
    setNewItem(prev => ({ ...prev, productId: p?._id || '', name: p?.name || '', size: '', price: 0 }))
  }

  const handleSizeSelect = (e) => {
    const sizeData = selProduct?.sizes?.find(s => s.size === e.target.value)
    setNewItem(prev => ({ ...prev, size: e.target.value, price: sizeData?.price || 0 }))
  }

  const confirmAddItem = () => {
    if (!newItem.productId || !newItem.size) { toast.error('Choisir un produit et une taille'); return }
    setItems(p => [...p, {
      product:     newItem.productId,
      name:        newItem.name,
      size:        newItem.size,
      doubleSided: false,
      quantity:    Number(newItem.quantity),
      price:       Number(newItem.price),
    }])
    setDirty(true)
    setAddModal(false)
  }

  const downloadLogo = async (url, idx) => {
    try {
      const res  = await fetch(url)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `logo-${id}-${idx + 1}.jpg`
      a.click()
    } catch { toast.error('Erreur téléchargement') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: PURPLE }} />
    </div>
  )
  if (!order) return null

  const currentOpt = STATUS_OPTIONS.find(o => o.value === status)
  const createdAt  = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'white', color: NAVY, border: '1.5px solid #e5e7eb' }}>
            <ArrowLeft size={15} /><span className="hidden sm:inline">Retour</span>
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Commande</p>
            <h1 className="text-xl sm:text-2xl font-black italic" style={{ color: NAVY }}>
              #{order._id.slice(-6).toUpperCase()}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: currentOpt?.bg, color: currentOpt?.color, border: `1.5px solid ${currentOpt?.color}30` }}>
            {currentOpt?.label}
          </span>
          {dirty && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold"
              style={{ background: PURPLE }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-4">

          {/* Infos client */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <User size={14} style={{ color: PURPLE }} />
                </div>
                <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                  Informations client
                </h2>
              </div>
              <button onClick={() => setEditClient(e => !e)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                style={editClient
                  ? { background: PURPLE, color: 'white', borderColor: PURPLE }
                  : { background: 'white', color: PURPLE, borderColor: 'rgba(124,58,237,0.3)' }}>
                <Pencil size={11} /> {editClient ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            {editClient ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'firstName', label: 'Prénom' },
                  { key: 'lastName',  label: 'Nom' },
                  { key: 'phone',     label: 'Téléphone' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
                    <input
                      value={clientForm[key] || ''}
                      onChange={e => { setClientForm(p => ({ ...p, [key]: e.target.value })); setDirty(true) }}
                      className="w-full px-3 py-2 rounded-xl border-2 text-sm outline-none focus:border-purple-400"
                      style={{ borderColor: '#e5e7eb', color: NAVY }}
                    />
                  </div>
                ))}

                {/* Wilaya */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Wilaya</label>
                  {loadingW
                    ? <div className="px-3 py-2 rounded-xl border-2 text-sm text-gray-400" style={{ borderColor: '#e5e7eb' }}>Chargement…</div>
                    : <select
                        value={wilayas.find(w => w.wilaya_name === clientForm.wilaya)?.wilaya_id || ''}
                        onChange={e => handleWilayaChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 text-sm outline-none focus:border-purple-400 appearance-none"
                        style={{ borderColor: '#e5e7eb', color: NAVY }}>
                        <option value="">— Choisir —</option>
                        {wilayas.map(w => (
                          <option key={w.wilaya_id} value={w.wilaya_id}>
                            {w.wilaya_id} — {w.wilaya_name}
                          </option>
                        ))}
                      </select>
                  }
                </div>

                {/* Commune */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Commune</label>
                  {loadingC
                    ? <div className="px-3 py-2 rounded-xl border-2 text-sm text-gray-400" style={{ borderColor: '#e5e7eb' }}>Chargement…</div>
                    : !clientForm.wilayaId && !wilayas.find(w => w.wilaya_name === clientForm.wilaya)
                      ? <div className="px-3 py-2 rounded-xl border-2 text-sm text-gray-400" style={{ borderColor: '#e5e7eb' }}>Sélectionnez une wilaya</div>
                      : <select
                          value={clientForm.commune || ''}
                          onChange={e => { setClientForm(p => ({ ...p, commune: e.target.value })); setDirty(true) }}
                          className="w-full px-3 py-2 rounded-xl border-2 text-sm outline-none focus:border-purple-400 appearance-none"
                          style={{ borderColor: '#e5e7eb', color: NAVY }}>
                          <option value="">— Choisir —</option>
                          {communes.map(c => (
                            <option key={c.nom} value={c.nom}>{c.nom}</option>
                          ))}
                        </select>
                  }
                </div>

                {/* Type de livraison */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Type de livraison</label>
                  <div className="flex gap-2">
                    {['Domicile', 'Stop Desk'].map(method => {
                      const active = (clientForm.deliveryMethod || order.customerInfo.deliveryMethod) === method
                      return (
                        <button key={method} type="button"
                          onClick={() => handleDeliveryMethodChange(method)}
                          className="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all"
                          style={active ? {
                            background: PURPLE, borderColor: PURPLE, color: 'white',
                            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                          } : {
                            background: 'white', borderColor: '#e5e7eb', color: '#9ca3af',
                          }}>
                          {method === 'Domicile' ? '🚚 À domicile' : '🏪 Stop Desk'}
                          {clientForm.deliveryFee != null && active && (
                            <span className="ml-1 text-xs opacity-80">
                              ({Number(clientForm.deliveryFee).toLocaleString('fr-DZ')} DA)
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                <InfoBlock label="Nom" icon={User}>
                  {order.customerInfo.firstName} {order.customerInfo.lastName}
                </InfoBlock>
                <InfoBlock label="Téléphone" icon={Phone} highlight>
                  <a href={`tel:${order.customerInfo.phone}`} style={{ color: PURPLE }}>
                    {order.customerInfo.phone}
                  </a>
                </InfoBlock>
                <InfoBlock label="Wilaya" icon={MapPin}>{order.customerInfo.wilaya}</InfoBlock>
                <InfoBlock label="Commune" icon={MapPin}>{order.customerInfo.commune}</InfoBlock>
                {order.customerInfo.deliveryMethod && (
                  <InfoBlock label="Livraison" icon={Truck}>{order.customerInfo.deliveryMethod}</InfoBlock>
                )}
              </div>
            )}

            {order.customerInfo.description && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={13} style={{ color: PURPLE }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Instructions</span>
                </div>
                <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  {order.customerInfo.description}
                </p>
              </div>
            )}
          </section>

          {/* Articles */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <Package size={14} style={{ color: PURPLE }} />
                </div>
                <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>
                  Articles commandés
                </h2>
              </div>
              <button onClick={openAddModal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border"
                style={{ background: 'white', color: PURPLE, borderColor: 'rgba(124,58,237,0.3)' }}>
                <Plus size={11} /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: NAVY }}>{item.name}</p>
                    <p className="text-xs text-gray-400">{item.size} — {Number(item.price).toLocaleString('fr-DZ')} DA/u</p>
                  </div>
                  {/* Qty — saisie directe au clavier */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val >= 1) updateQty(i, val)
                      }}
                      onBlur={e => {
                        const val = parseInt(e.target.value, 10)
                        if (isNaN(val) || val < 1) updateQty(i, 1)
                      }}
                      className="w-20 text-center text-sm font-black rounded-lg border-2 py-1.5 outline-none focus:border-purple-400 transition-all"
                      style={{ borderColor: '#e5e7eb', color: PURPLE }}
                    />
                    <span className="text-xs text-gray-400">unités</span>
                  </div>
                  <span className="text-sm font-black w-24 text-right" style={{ color: PURPLE }}>
                    {(Number(item.price) * Number(item.quantity)).toLocaleString('fr-DZ')} DA
                  </span>
                  <button onClick={() => removeItem(i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            {order.customerInfo?.deliveryFee != null && (
              <div className="flex items-center justify-between px-4 py-2 mt-3 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)' }}>
                <span className="text-sm text-gray-500">
                  Frais de livraison
                  {order.customerInfo.deliveryMethod && (
                    <span className="ml-1 text-xs text-purple-400">({order.customerInfo.deliveryMethod})</span>
                  )}
                </span>
                <span className="font-bold text-sm" style={{ color: NAVY }}>
                  {Number(order.customerInfo.deliveryFee).toLocaleString('fr-DZ')} DA
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 mt-2 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <span className="font-bold text-sm" style={{ color: NAVY }}>Total commande</span>
              <span className="font-black text-2xl" style={{ color: PURPLE }}>
                {computedTotal.toLocaleString('fr-DZ')}
                <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
              </span>
            </div>
          </section>

          {/* Logos */}
          {order.customerInfo.logoUrls?.length > 0 && (
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <Tag size={14} style={{ color: PURPLE }} />
                </div>
                <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>Fichiers client</h2>
              </div>
              <div className="flex gap-4 flex-wrap">
                {order.customerInfo.logoUrls.map((url, idx) => {
                  const isPdf = url?.toLowerCase().includes('.pdf') || url?.includes('/raw/')
                  if (isPdf) {
                    const filename = url.split('/').pop()?.split('?')[0] || `logo-${idx + 1}.pdf`
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 w-28"
                        style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.03)' }}>
                        <FileText size={32} style={{ color: PURPLE }} />
                        <span className="text-[10px] text-gray-500 text-center break-all line-clamp-2">
                          {filename.length > 18 ? filename.slice(0, 16) + '…' : filename}
                        </span>
                        <div className="flex gap-1.5 w-full">
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center py-1 rounded-lg text-[10px] font-bold text-white"
                            style={{ background: PURPLE }}>Ouvrir</a>
                          <button onClick={() => downloadLogo(url, idx)}
                            className="w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'rgba(124,58,237,0.12)', color: PURPLE }}>
                            <Download size={11} />
                          </button>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`logo ${idx + 1}`}
                        className="w-24 h-24 object-contain rounded-xl border-2 bg-gray-50"
                        style={{ borderColor: 'rgba(124,58,237,0.2)' }} />
                      <button onClick={() => downloadLogo(url, idx)}
                        className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold shadow-md"
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

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Détails */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Hash size={14} style={{ color: PURPLE }} />
              </div>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>Détails</h2>
            </div>
            <div className="space-y-3">
              <InfoBlock label="Référence">#{order._id.slice(-6).toUpperCase()}</InfoBlock>
              <InfoBlock label="Date">{createdAt}</InfoBlock>
              <InfoBlock label="Unités">
                {items.reduce((s, i) => s + Number(i.quantity), 0).toLocaleString()} unités
              </InfoBlock>
            </div>
          </section>

          {/* Statut */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <CheckCircle2 size={14} style={{ color: PURPLE }} />
              </div>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: PURPLE }}>Statut</h2>
            </div>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { setStatus(opt.value); setDirty(opt.value !== order.status || dirty) }}
                  className="py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all text-left flex items-center gap-2"
                  style={{
                    background:  status === opt.value ? opt.color : 'white',
                    borderColor: status === opt.value ? opt.color : '#e5e7eb',
                    color:       status === opt.value ? 'white'   : opt.color,
                    boxShadow:   status === opt.value ? `0 4px 12px ${opt.color}40` : 'none',
                  }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: status === opt.value ? 'white' : opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Modal ajout produit */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setAddModal(false) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg" style={{ color: NAVY }}>Ajouter un article</h3>
              <button onClick={() => setAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            {/* Produit */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Produit</label>
              <select value={newItem.productId} onChange={handleProductSelect}
                className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none"
                style={{ borderColor: '#e5e7eb', color: NAVY }}>
                <option value="">— Choisir —</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Taille */}
            {selProduct && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Taille</label>
                <select value={newItem.size} onChange={handleSizeSelect}
                  className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e5e7eb', color: NAVY }}>
                  <option value="">— Choisir —</option>
                  {selProduct.sizes.map(s => (
                    <option key={s.size} value={s.size}>{s.size} — {s.price.toLocaleString('fr-DZ')} DA</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantité */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Quantité</label>
              <input type="number" min="1" value={newItem.quantity}
                onChange={e => setNewItem(p => ({ ...p, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none"
                style={{ borderColor: '#e5e7eb', color: NAVY }} />
            </div>

            {newItem.price > 0 && (
              <p className="text-sm font-bold text-center" style={{ color: PURPLE }}>
                Total : {(newItem.price * newItem.quantity).toLocaleString('fr-DZ')} DA
              </p>
            )}

            <button onClick={confirmAddItem}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: PURPLE }}>
              <Plus size={15} /> Confirmer l'ajout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}