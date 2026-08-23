// src/Components/staff/OrderForm.jsx
// Formulaire de commande utilisé par la confirmatrice, en création comme en
// modification. `order = null` → création ; sinon édition de la commande.

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, Loader2, Save, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { wilayas } from '../../data/wilayas'
import { NAVY, PURPLE, STATUS_KEYS, ORDER_STATUS, URGENCY_KEYS, URGENCY } from './staffConfig'

const DELIVERY_METHODS = ['Domicile', 'Stop Desk']

// Libellés lisibles des catégories du catalogue
const CATEGORIES = {
  Board:        'Boites',
  Bags:         'Sacs',
  Autocollants: 'Cartes & Autocollants',
  Paper:        'Papier',
}

const emptyCustomer = {
  firstName: '', lastName: '', phone: '',
  wilaya: '', wilayaCode: null, commune: '',
  description: '', deliveryMethod: 'Domicile', deliveryFee: '',
}

const emptyItem = () => ({
  product: '', name: '', size: '', quantity: 1, price: '',
})

const field = 'w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors'
const label = 'block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400'

// `asChef` : marque l'intention du chef de production, seule façon de modifier
// une commande déjà en fabrication (voir canForce côté serveur).
function OrderForm({ order, onClose, onSaved, asChef = false }) {
  const isEdit = !!order

  const [customer, setCustomer] = useState(emptyCustomer)
  const [items, setItems]       = useState([emptyItem()])
  const [status, setStatus]     = useState('en attente')
  const [urgency, setUrgency]   = useState('normal')
  const [totalOverride, setTotalOverride] = useState('')  // vide = calcul auto

  const [products, setProducts] = useState([])
  const [saving, setSaving]     = useState(false)

  /* ── Catalogue COMPLET (y compris les catégories masquées au public) ── */
  useEffect(() => {
    staffApi.get('/workflow/products')
      .then(res => setProducts(Array.isArray(res.data) ? res.data : (res.data?.products || [])))
      .catch(() => { /* saisie libre possible sans catalogue */ })
  }, [])

  /* ── Pré-remplissage en modification ── */
  useEffect(() => {
    if (!order) return
    const c = order.customerInfo || {}
    setCustomer({
      firstName: c.firstName || '', lastName: c.lastName || '', phone: c.phone || '',
      wilaya: c.wilaya || '', wilayaCode: c.wilayaCode ?? null, commune: c.commune || '',
      description: c.description || '',
      deliveryMethod: c.deliveryMethod || 'Domicile',
      deliveryFee: c.deliveryFee ?? '',
    })
    setItems((order.items || []).map(i => ({
      product:  i.product?._id || i.product || '',
      name:     i.name || '',
      size:     i.size || '',
      quantity: i.quantity ?? 1,
      price:    i.price ?? '',
      doubleSided: !!i.doubleSided,
      selectedColors: i.selectedColors || [],
      numberOfColors: i.numberOfColors ?? null,
    })))
    setStatus(order.status || 'en attente')
    setUrgency(order.pipeline?.urgency || 'normal')
    setTotalOverride('')
  }, [order])

  /* ── Total calculé ── */
  const computed = items.reduce(
    (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0
  ) + (Number(customer.deliveryFee) || 0)
  const finalTotal = totalOverride !== '' ? Number(totalOverride) : computed

  /* ── Articles ── */
  const setItem = (idx, patch) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))

  const productById = useCallback(
    (id) => products.find(p => p._id === id), [products]
  )

  const onProductChange = (idx, productId) => {
    const p = productById(productId)
    setItem(idx, {
      product: productId,
      name:    p?.name || '',
      size:    '',
      price:   '',
    })
  }

  const onSizeChange = (idx, size) => {
    const p = productById(items[idx].product)
    const sizeData = p?.sizes?.find(s => String(s.size) === String(size))
    setItem(idx, { size, price: sizeData ? sizeData.price : items[idx].price })
  }

  const addItem    = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  /* ── Wilaya ── */
  const onWilayaChange = (name) => {
    const w = wilayas.find(x => x.name === name)
    setCustomer(p => ({ ...p, wilaya: name, wilayaCode: w ? parseInt(w.code, 10) : null }))
  }

  /* ── Enregistrement ── */
  const submit = async (e) => {
    e.preventDefault()

    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.phone.trim())
      return toast.error('Prénom, nom et téléphone sont requis')
    if (!customer.wilaya || !customer.commune.trim())
      return toast.error('Wilaya et commune sont requises')

    const cleanItems = items.filter(i => (i.name || i.product) && Number(i.quantity) > 0)
    if (cleanItems.length === 0) return toast.error('Ajoutez au moins un article')

    const payload = {
      customerInfo: {
        ...customer,
        deliveryFee: customer.deliveryFee === '' ? null : Number(customer.deliveryFee),
      },
      items: cleanItems.map(i => ({
        product:  i.product || undefined,
        name:     i.name,
        size:     i.size,
        quantity: Number(i.quantity),
        price:    Number(i.price) || 0,
        doubleSided:    i.doubleSided,
        selectedColors: i.selectedColors,
        numberOfColors: i.numberOfColors,
      })),
      total: finalTotal,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await staffApi.put(`/workflow/orders/${order._id}`, { ...payload, asChef })
        toast.success('Commande modifiée')
      } else {
        await staffApi.post('/workflow/confirmation', { ...payload, status, urgency })
        toast.success('Commande créée')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur d\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const selectedProduct = (idx) => productById(items[idx]?.product)

  return (
    /* La carte défile elle-même : un arrière-plan défilant ferait coller
       l'en-tête sous le bord de l'écran, avec le contenu visible au-dessus. */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(30,27,75,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-full overflow-y-auto overflow-x-hidden"
        onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
              <ShoppingBag size={17} style={{ color: PURPLE }} />
            </div>
            <p className="font-black text-sm" style={{ color: NAVY }}>
              {isEdit ? 'Modifier la commande' : 'Nouvelle commande'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">

          {/* ── Client ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>Client</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Prénom *</label>
                <input value={customer.firstName} className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Nom *</label>
                <input value={customer.lastName} className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Téléphone *</label>
                <input value={customer.phone} type="tel" placeholder="0xxxxxxxxx" className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Wilaya *</label>
                <select value={customer.wilaya} className={field} style={{ color: NAVY }}
                  onChange={e => onWilayaChange(e.target.value)}>
                  <option value="">Sélectionner…</option>
                  {wilayas.map(w => <option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Commune *</label>
                <input value={customer.commune} className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, commune: e.target.value }))} />
              </div>
              <div>
                <label className={label}>Livraison</label>
                <select value={customer.deliveryMethod} className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, deliveryMethod: e.target.value }))}>
                  {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Frais de livraison (DA)</label>
                <input type="number" min="0" value={customer.deliveryFee} className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, deliveryFee: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Description / instructions</label>
                <textarea rows={2} value={customer.description}
                  className={`${field} resize-none`} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ── Articles ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>Articles</p>
            <div className="space-y-3">
              {items.map((it, idx) => {
                const p = selectedProduct(idx)
                return (
                  <div key={idx} className="p-3 rounded-xl border-2 border-gray-100 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select value={it.product} className={field} style={{ color: NAVY }}
                        onChange={e => onProductChange(idx, e.target.value)}>
                        <option value="">— Produit libre —</option>
                        {products.map(pr => (
                          <option key={pr._id} value={pr._id}>
                            {pr.name}{pr.category ? ` — ${CATEGORIES[pr.category] || pr.category}` : ''}
                          </option>
                        ))}
                      </select>
                      <input value={it.name} placeholder="Nom de l'article *" className={field} style={{ color: NAVY }}
                        onChange={e => setItem(idx, { name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {p?.sizes?.length > 0 ? (
                        <select value={it.size} className={field} style={{ color: NAVY }}
                          onChange={e => onSizeChange(idx, e.target.value)}>
                          <option value="">Taille…</option>
                          {p.sizes.map(s => <option key={s.size} value={s.size}>{s.size} — {s.price} DA</option>)}
                        </select>
                      ) : (
                        <input value={it.size} placeholder="Taille" className={field} style={{ color: NAVY }}
                          onChange={e => setItem(idx, { size: e.target.value })} />
                      )}
                      <input type="number" min="1" value={it.quantity} placeholder="Qté" className={field} style={{ color: NAVY }}
                        onChange={e => setItem(idx, { quantity: e.target.value })} />
                      <div className="flex gap-1">
                        <input type="number" min="0" value={it.price} placeholder="Prix U." className={field} style={{ color: NAVY }}
                          onChange={e => setItem(idx, { price: e.target.value })} />
                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 text-right">
                      Sous-total : <span className="font-bold" style={{ color: NAVY }}>
                        {((Number(it.price) || 0) * (Number(it.quantity) || 0)).toLocaleString('fr-DZ')} DA
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>
            <button type="button" onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold py-2 px-1 -mx-1 rounded-lg transition-colors hover:opacity-70" style={{ color: PURPLE }}>
              <Plus size={14} /> Ajouter un article
            </button>
          </div>

          {/* ── Statut & urgence (création uniquement) ── */}
          {!isEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Statut initial</label>
                <select value={status} className={field} style={{ color: NAVY }}
                  onChange={e => setStatus(e.target.value)}>
                  {STATUS_KEYS.map(s => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Urgence</label>
                <select value={urgency} className={field} style={{ color: NAVY }}
                  onChange={e => setUrgency(e.target.value)}>
                  {URGENCY_KEYS.map(u => <option key={u} value={u}>{URGENCY[u].label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── Total ── */}
          <div className="p-4 rounded-xl" style={{ background: '#faf9ff' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculé : {computed.toLocaleString('fr-DZ')} DA
                  {customer.deliveryFee !== '' && ` (dont ${Number(customer.deliveryFee).toLocaleString('fr-DZ')} DA de livraison)`}
                </p>
              </div>
              <div className="text-right">
                <input type="number" min="0" value={totalOverride} placeholder={String(computed)}
                  className="w-32 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-black text-right outline-none focus:border-purple-400"
                  style={{ color: PURPLE }}
                  onChange={e => setTotalOverride(e.target.value)} />
                <p className="text-[11px] text-gray-400 mt-1">Laisser vide = auto</p>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: PURPLE }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isEdit ? 'Enregistrer les modifications' : 'Créer la commande'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderForm
