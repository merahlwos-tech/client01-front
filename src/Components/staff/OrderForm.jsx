// src/Components/staff/OrderForm.jsx
// Formulaire de commande utilisé par la confirmatrice, en création comme en
// modification. `order = null` → création ; sinon édition de la commande.
//
// La saisie reprend EXACTEMENT le parcours d'un client sur le site :
// mêmes options produit (couleur, nombre de couleurs, recto-verso), mêmes
// paliers de quantité, mêmes tarifs de livraison Ecotrack. Les prix sont donc
// calculés automatiquement — la confirmatrice peut les forcer si elle négocie.

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, Plus, Trash2, Loader2, Save, ShoppingBag, ImagePlus, FileText,
  Truck, Store, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { uploadMultipleToCloudinary } from '../../utils/uploadCloudinary'
import { priceBreakdown } from '../../utils/pricing'
import { colorName } from '../../data/productColors'
import useEcotrack from './useEcotrack'
import {
  NAVY, PURPLE, STATUS_KEYS, ORDER_STATUS, URGENCY_KEYS, URGENCY,
  COLOR_OPTIONS, swatchOf,
} from './staffConfig'

// Libellés lisibles des catégories du catalogue
const CATEGORIES = {
  Board:        'Boites',
  Bags:         'Sacs',
  Autocollants: 'Cartes & Autocollants',
  Paper:        'Papier',
}
const CATEGORY_KEYS = Object.keys(CATEGORIES)

// Nombre de fichiers de logo acceptés par commande
const MAX_LOGOS = 4

// Numéros secondaires acceptés en plus du principal (aligné sur le back)
const MAX_EXTRA_PHONES = 5

// Mêmes paliers de quantité que sur le site (QuantitySelector)
const QTY_OPTIONS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000]

// Format des mobiles algériens — le site le vérifie, on se contente d'alerter
const MOBILE_RX = /^0(5|6|7)\d{8}$/

const isPdf = (url) => /\.pdf($|\?)/i.test(url || '')

const emptyCustomer = {
  firstName: '', lastName: '', phone: '', extraPhones: [],
  wilaya: '', wilayaCode: null, commune: '',
  description: '', stopDesk: false, feeOverride: '',
}

const emptyItem = () => ({
  category: '', product: '', name: '', size: '', quantity: 100,
  doubleSided: false, selectedColors: [], numberOfColors: 1,
  priceOverride: '',          // vide = prix du site
  bagColor: '', printColor: '',
})

const field = 'w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors'
const label = 'block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400'

const money = (n) => Number(n || 0).toLocaleString('fr-DZ')

/* Champ de couleur libre (« bleu ciel », « Pantone 485 »…) avec les teintes
   courantes en suggestion et une pastille quand le nom est reconnu. */
function ColorField({ id, label: text, value, onChange }) {
  const swatch = swatchOf(value)
  return (
    <div>
      <label className={label} htmlFor={id}>{text}</label>
      <div className="relative">
        <input id={id} list={`${id}-list`} value={value} placeholder="Ex. kraft, blanc…"
          className={`${field} ${swatch ? 'pl-9' : ''}`} style={{ color: NAVY }}
          onChange={e => onChange(e.target.value)} />
        {swatch && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border pointer-events-none"
            style={{ background: swatch, borderColor: 'rgba(0,0,0,0.2)' }} />
        )}
      </div>
      <datalist id={`${id}-list`}>
        {COLOR_OPTIONS.map(c => <option key={c} value={c} />)}
      </datalist>
    </div>
  )
}

/* Interrupteur recto-verso — même option que sur la fiche produit */
function Toggle({ on, onChange, title, hint }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
      style={{ borderColor: on ? PURPLE : '#e5e7eb', background: on ? 'rgba(124,58,237,0.04)' : '#f9fafb' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: NAVY }}>{title}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <span className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
        style={{ background: on ? PURPLE : '#d1d5db' }}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

// `asChef` : marque l'intention du chef de production, seule façon de modifier
// une commande déjà en fabrication (voir canForce côté serveur).
function OrderForm({ order, onClose, onSaved, asChef = false }) {
  const isEdit = !!order

  const [customer, setCustomer] = useState(emptyCustomer)
  const [wilayaId, setWilayaId] = useState('')
  const [items, setItems]       = useState([emptyItem()])
  const [status, setStatus]     = useState('en attente')
  const [urgency, setUrgency]   = useState('normal')
  const [totalOverride, setTotalOverride] = useState('')  // vide = calcul auto

  const [products, setProducts] = useState([])
  const [saving, setSaving]     = useState(false)

  const { wilayas, communes, loadingW, loadingC, loadCommunes, feesForWilaya } = useEcotrack()

  /* Logos du client : images ou PDF, envoyés directement à Cloudinary */
  const [logoUrls, setLogoUrls]   = useState([])
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef(null)

  const addLogos = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (logoUrls.length + files.length > MAX_LOGOS) {
      toast.error(`${MAX_LOGOS} fichiers au maximum`)
      return
    }
    setUploading(true)
    try {
      const urls = await uploadMultipleToCloudinary(files)
      setLogoUrls(prev => [...prev, ...urls])
      toast.success(`${urls.length} fichier(s) ajouté(s)`)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const removeLogo = (url) => setLogoUrls(prev => prev.filter(u => u !== url))

  /* ── Catalogue COMPLET (y compris les catégories masquées au public) ── */
  useEffect(() => {
    staffApi.get('/workflow/products')
      .then(res => setProducts(Array.isArray(res.data) ? res.data : (res.data?.products || [])))
      .catch(() => { /* saisie libre possible sans catalogue */ })
  }, [])

  /* ── Pré-remplissage en modification ──
     Le prix enregistré est conservé tel quel : une commande déjà négociée ne
     doit pas être recalculée parce qu'on corrige une adresse. Il repasse en
     automatique dès qu'une option du produit change. */
  useEffect(() => {
    if (!order) return
    const c = order.customerInfo || {}
    setCustomer({
      firstName: c.firstName || '', lastName: c.lastName || '', phone: c.phone || '',
      extraPhones: Array.isArray(c.extraPhones) ? c.extraPhones : [],
      wilaya: c.wilaya || '', wilayaCode: c.wilayaCode ?? null, commune: c.commune || '',
      description: c.description || '',
      stopDesk: c.deliveryMethod === 'Stop Desk',
      feeOverride: c.deliveryFee ?? '',
    })
    if (c.wilayaCode) { setWilayaId(String(c.wilayaCode)); loadCommunes(String(c.wilayaCode)) }
    setItems((order.items || []).map(i => ({
      product:  i.product?._id || i.product || '',
      name:     i.name || '',
      size:     i.size || '',
      quantity: i.quantity ?? 100,
      doubleSided: !!i.doubleSided,
      selectedColors: i.selectedColors || [],
      numberOfColors: i.numberOfColors ?? 1,
      priceOverride: i.price ?? '',
      bagColor:   i.bagColor   || '',
      printColor: i.printColor || '',
    })))
    setLogoUrls(Array.isArray(c.logoUrls) ? c.logoUrls : [])
    setStatus(order.status || 'en attente')
    setUrgency(order.pipeline?.urgency || 'normal')
    setTotalOverride('')
  }, [order, loadCommunes])

  /* ── Articles ── */
  const setItem = (idx, patch) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))

  // Toute option qui change le prix du site remet le calcul en automatique
  const setPricedItem = (idx, patch) => setItem(idx, { ...patch, priceOverride: '' })

  const productById = useCallback(
    (id) => products.find(p => p._id === id), [products]
  )

  /* Catégorie de l'article : celle choisie, sinon déduite du produit
     (utile à l'ouverture en modification, où seule la référence est connue) */
  const itemCategory = (it) =>
    it.category
    || productById(it.product)?.category
    || (it.name ? 'libre' : '')   // article saisi hors catalogue

  const productsOfCategory = (cat) =>
    cat && cat !== 'libre' ? products.filter(p => p.category === cat) : []

  /* Prix d'un article, exactement comme sur la fiche produit */
  const lineOf = (it) => {
    const p = productById(it.product)
    const b = priceBreakdown(p, it.size, it.quantity, it.doubleSided, it.numberOfColors)
    const forced = it.priceOverride !== '' && it.priceOverride != null
    const unit = forced ? Number(it.priceOverride) || 0 : b.unitPrice
    return { ...b, product: p, forced, unit, lineTotal: unit * (Number(it.quantity) || 0) }
  }

  /* Changer de type remet à zéro le produit : tailles, options et prix en dépendent */
  const onCategoryChange = (idx, cat) =>
    setPricedItem(idx, {
      category: cat, product: '', name: '', size: '',
      selectedColors: [], numberOfColors: 1, doubleSided: false,
    })

  const onProductChange = (idx, productId) => {
    const p = productById(productId)
    setPricedItem(idx, {
      product: productId,
      name:    p?.name || '',
      // Le site présélectionne la première taille et repart d'options neuves
      size:    p?.sizes?.[0]?.size || '',
      selectedColors: [], numberOfColors: 1, doubleSided: false,
    })
  }

  const addItem    = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  /* ── Numéros secondaires du client ── */
  const setExtraPhone = (i, v) => setCustomer(p => ({
    ...p, extraPhones: p.extraPhones.map((x, idx) => idx === i ? v : x),
  }))
  const addExtraPhone = () => setCustomer(p => (
    p.extraPhones.length >= MAX_EXTRA_PHONES
      ? p
      : { ...p, extraPhones: [...p.extraPhones, ''] }
  ))
  const removeExtraPhone = (i) => setCustomer(p => ({
    ...p, extraPhones: p.extraPhones.filter((_, idx) => idx !== i),
  }))

  /* ── Wilaya / commune / livraison — mêmes données que le site ── */
  const onWilayaChange = (id) => {
    const w = wilayas.find(x => String(x.wilaya_id) === String(id))
    setWilayaId(id)
    setCustomer(p => ({
      ...p,
      wilaya: w?.wilaya_name || '',
      wilayaCode: id ? Number(id) : null,
      commune: '', stopDesk: false, feeOverride: '',
    }))
    loadCommunes(id)
  }

  const currentFees = wilayaId ? feesForWilaya(wilayaId) : null
  const autoFee = currentFees
    ? Number(customer.stopDesk ? currentFees.tarif_stopdesk : currentFees.tarif)
    : null
  const deliveryFee = customer.feeOverride !== '' && customer.feeOverride != null
    ? Number(customer.feeOverride)
    : autoFee

  const hasStopDesk     = communes.some(c => c.has_stop_desk === 1)
  const visibleCommunes = customer.stopDesk
    ? communes.filter(c => c.has_stop_desk === 1)
    : communes

  const setStopDesk = (val) => setCustomer(p => ({
    ...p, stopDesk: val, commune: val ? '' : p.commune, feeOverride: '',
  }))

  /* ── Total ── */
  const itemsTotal = items.reduce((s, it) => s + lineOf(it).lineTotal, 0)
  const computed   = itemsTotal + (Number(deliveryFee) || 0)
  const finalTotal = totalOverride !== '' ? Number(totalOverride) : computed

  const phoneWarning = customer.phone.trim() !== ''
    && !MOBILE_RX.test(customer.phone.replace(/\s/g, ''))

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
        firstName: customer.firstName, lastName: customer.lastName,
        phone: customer.phone,
        // Les champs laissés vides ne sont pas envoyés
        extraPhones: customer.extraPhones.map(p => p.trim()).filter(Boolean),
        wilaya: customer.wilaya, wilayaCode: customer.wilayaCode,
        commune: customer.commune, description: customer.description,
        deliveryMethod: customer.stopDesk ? 'Stop Desk' : 'Domicile',
        deliveryFee: deliveryFee == null ? null : Number(deliveryFee),
        logoUrls,
      },
      items: cleanItems.map(i => ({
        product:  i.product || undefined,
        name:     i.name,
        size:     i.size,
        quantity: Number(i.quantity),
        price:    lineOf(i).unit,
        doubleSided:    i.doubleSided,
        selectedColors: i.selectedColors,
        numberOfColors: i.numberOfColors,
        bagColor:   (i.bagColor   || '').trim(),
        printColor: (i.printColor || '').trim(),
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

              {/* Téléphone principal + numéros supplémentaires du client */}
              <div>
                <label className={label}>Téléphone *</label>
                <input value={customer.phone} type="tel" placeholder="0551234567" className={field} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} />
                {phoneWarning && (
                  <p className="flex items-center gap-1 text-[11px] mt-1" style={{ color: '#b45309' }}>
                    <AlertTriangle size={11} /> Format inhabituel — le site attend 0[5/6/7] + 8 chiffres.
                  </p>
                )}

                {customer.extraPhones.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {customer.extraPhones.map((ph, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input value={ph} type="tel" placeholder={`Autre numéro ${i + 1}`}
                          className={field} style={{ color: NAVY }}
                          onChange={e => setExtraPhone(i, e.target.value)} />
                        <button type="button" onClick={() => removeExtraPhone(i)}
                          title="Retirer ce numéro"
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {customer.extraPhones.length < MAX_EXTRA_PHONES && (
                  <button type="button" onClick={addExtraPhone}
                    className="mt-1.5 flex items-center gap-1.5 text-xs font-bold py-1.5 px-1 -mx-1 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: PURPLE }}>
                    <Plus size={13} /> Ajouter un numéro
                  </button>
                )}
              </div>

              {/* Wilaya — liste Ecotrack, comme le formulaire du site */}
              <div>
                <label className={label}>Wilaya *</label>
                {loadingW ? (
                  <div className={`${field} flex items-center gap-2 text-gray-400`}>
                    <Loader2 size={14} className="animate-spin" /> Chargement…
                  </div>
                ) : (
                  <select value={wilayaId} className={field} style={{ color: NAVY }}
                    onChange={e => onWilayaChange(e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {wilayas.map(w => (
                      <option key={w.wilaya_id} value={w.wilaya_id}>
                        {w.wilaya_id} — {w.wilaya_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Commune — liste Ecotrack de la wilaya choisie */}
              <div>
                <label className={label}>Commune *</label>
                {loadingC ? (
                  <div className={`${field} flex items-center gap-2 text-gray-400`}>
                    <Loader2 size={14} className="animate-spin" /> Chargement…
                  </div>
                ) : !wilayaId ? (
                  <input disabled placeholder="Choisir d'abord la wilaya"
                    className={`${field} opacity-50 cursor-not-allowed`} />
                ) : visibleCommunes.length === 0 ? (
                  /* Ecotrack muet : la saisie libre évite de bloquer l'appel */
                  <input value={customer.commune} placeholder="Commune"
                    className={field} style={{ color: NAVY }}
                    onChange={e => setCustomer(p => ({ ...p, commune: e.target.value }))} />
                ) : (
                  <select value={customer.commune} className={field} style={{ color: NAVY }}
                    onChange={e => setCustomer(p => ({ ...p, commune: e.target.value }))}>
                    <option value="">— Choisir une commune —</option>
                    {/* Commande déjà enregistrée avec une commune absente de la
                        liste Ecotrack : on la garde pour ne pas l'effacer. */}
                    {customer.commune && !visibleCommunes.some(c => c.nom === customer.commune) && (
                      <option value={customer.commune}>{customer.commune}</option>
                    )}
                    {visibleCommunes.map(c => (
                      <option key={c.nom} value={c.nom}>{c.nom}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Domicile / Stop Desk — mêmes tarifs que le site */}
              {wilayaId && (
                <div className="sm:col-span-2">
                  <label className={label}>Livraison</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStopDesk(false)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                      style={!customer.stopDesk
                        ? { borderColor: PURPLE, background: PURPLE, color: 'white' }
                        : { borderColor: '#e5e7eb', background: 'white', color: '#9ca3af' }}>
                      <Truck size={17} /> À domicile
                      {currentFees && (
                        <span className="text-xs font-black">{money(currentFees.tarif)} DA</span>
                      )}
                    </button>
                    <button type="button" onClick={() => setStopDesk(true)}
                      disabled={!hasStopDesk && communes.length > 0}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={customer.stopDesk
                        ? { borderColor: PURPLE, background: PURPLE, color: 'white' }
                        : { borderColor: '#e5e7eb', background: 'white', color: '#9ca3af' }}>
                      <Store size={17} /> Stop Desk
                      {currentFees && (
                        <span className="text-xs font-black">{money(currentFees.tarif_stopdesk)} DA</span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400 flex-1">
                      Frais de livraison
                      {autoFee != null && customer.feeOverride !== ''
                        && Number(customer.feeOverride) !== autoFee
                        && <span className="ml-1" style={{ color: '#b45309' }}>(tarif forcé — auto : {money(autoFee)} DA)</span>}
                    </span>
                    <input type="number" min="0" value={customer.feeOverride}
                      placeholder={autoFee != null ? String(autoFee) : '—'}
                      className="w-28 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-right outline-none focus:border-purple-400"
                      style={{ color: NAVY }}
                      onChange={e => setCustomer(p => ({ ...p, feeOverride: e.target.value }))} />
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className={label}>Description / instructions</label>
                <textarea rows={2} value={customer.description}
                  className={`${field} resize-none`} style={{ color: NAVY }}
                  onChange={e => setCustomer(p => ({ ...p, description: e.target.value }))} />
              </div>

              {/* Logo(s) du client — images ou PDF */}
              <div className="sm:col-span-2">
                <label className={label}>Logo du client ({MAX_LOGOS} fichiers max)</label>

                <div className="flex flex-wrap gap-2 items-center">
                  {logoUrls.map(url => (
                    <div key={url} className="relative">
                      {isPdf(url) ? (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-0.5 w-20 h-20 rounded-xl border-2 text-[10px] font-bold"
                          style={{ borderColor: 'rgba(124,58,237,0.25)', background: '#faf9ff', color: PURPLE }}>
                          <FileText size={20} /> PDF
                        </a>
                      ) : (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="logo" width={80} height={80}
                            className="w-20 h-20 rounded-xl object-cover border-2"
                            style={{ borderColor: 'rgba(124,58,237,0.25)' }} />
                        </a>
                      )}
                      <button type="button" onClick={() => removeLogo(url)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
                        style={{ background: '#ef4444' }}>
                        <X size={11} color="white" />
                      </button>
                    </div>
                  ))}

                  {logoUrls.length < MAX_LOGOS && (
                    <>
                      <input ref={logoInputRef} type="file" accept="image/*,application/pdf"
                        multiple onChange={addLogos} className="hidden" id="order-logo-input" />
                      <label htmlFor="order-logo-input"
                        className="flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-xl border-2 border-dashed cursor-pointer text-[10px] font-bold transition-all hover:opacity-80"
                        style={{ borderColor: 'rgba(124,58,237,0.35)', color: PURPLE, background: '#faf9ff' }}>
                        {uploading
                          ? <Loader2 size={20} className="animate-spin" />
                          : <><ImagePlus size={20} /> Ajouter</>}
                      </label>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Images ou PDF — visibles ensuite par le designer et la production.
                </p>
              </div>
            </div>
          </div>

          {/* ── Articles ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>Articles</p>
            <div className="space-y-3">
              {items.map((it, idx) => {
                const L   = lineOf(it)
                const p   = L.product
                const cat = itemCategory(it)
                return (
                  <div key={idx} className="p-3 rounded-xl border-2 border-gray-100 space-y-2">

                    {/* Type de produit → nom du produit (comme sur le site) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className={label}>Type de produit</label>
                        <select value={cat} className={field} style={{ color: NAVY }}
                          onChange={e => onCategoryChange(idx, e.target.value)}>
                          <option value="">Choisir…</option>
                          {CATEGORY_KEYS.map(k => (
                            <option key={k} value={k}>{CATEGORIES[k]}</option>
                          ))}
                          <option value="libre">Article libre (hors catalogue)</option>
                        </select>
                      </div>
                      <div>
                        <label className={label}>Nom du produit</label>
                        {cat === 'libre' ? (
                          <input value={it.name} placeholder="Nom de l'article *"
                            className={field} style={{ color: NAVY }}
                            onChange={e => setItem(idx, { name: e.target.value })} />
                        ) : (
                          <select value={it.product} className={field} style={{ color: NAVY }}
                            onChange={e => onProductChange(idx, e.target.value)}>
                            <option value="">Choisir…</option>
                            {productsOfCategory(cat).map(pr => (
                              <option key={pr._id} value={pr._id}>{pr.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Taille et quantité — mêmes paliers que la fiche produit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className={label}>Taille</label>
                        {p?.sizes?.length > 0 ? (
                          <select value={it.size} className={field} style={{ color: NAVY }}
                            onChange={e => setPricedItem(idx, { size: e.target.value })}>
                            <option value="">Choisir…</option>
                            {p.sizes.map(s => (
                              <option key={s.size} value={s.size}>{s.size} — {money(s.price)} DA</option>
                            ))}
                          </select>
                        ) : (
                          <input value={it.size} placeholder="Taille" className={field} style={{ color: NAVY }}
                            onChange={e => setItem(idx, { size: e.target.value })} />
                        )}
                      </div>
                      <div>
                        <label className={label}>Quantité</label>
                        {QTY_OPTIONS.includes(Number(it.quantity)) || it.quantity === '' ? (
                          <select value={it.quantity} className={field} style={{ color: NAVY }}
                            onChange={e => setPricedItem(idx, {
                              quantity: e.target.value === 'autre' ? '' : Number(e.target.value),
                            })}>
                            {QTY_OPTIONS.map(q => {
                              const b = priceBreakdown(p, it.size, q, it.doubleSided, it.numberOfColors)
                              return (
                                <option key={q} value={q}>
                                  {q.toLocaleString('fr-DZ')}
                                  {b.unitPrice > 0 ? ` — ${money(b.unitPrice)} DA/u` : ''}
                                </option>
                              )
                            })}
                            <option value="autre">Autre…</option>
                          </select>
                        ) : (
                          <input type="number" min="1" value={it.quantity} placeholder="Qté"
                            className={field} style={{ color: NAVY }} autoFocus
                            onChange={e => setPricedItem(idx, { quantity: e.target.value })} />
                        )}
                      </div>
                    </div>

                    {/* Couleur du produit — proposée seulement si le produit en a */}
                    {p?.colors?.length > 0 && (
                      <div>
                        <label className={label}>Couleur du produit</label>
                        <div className="flex items-center gap-2">
                          {it.selectedColors?.[0] && (
                            <span className="w-7 h-7 rounded-lg border flex-shrink-0"
                              style={{
                                background: p.colors.find(h => colorName(h) === it.selectedColors[0]) || '#fff',
                                borderColor: 'rgba(0,0,0,0.15)',
                              }} />
                          )}
                          <select value={it.selectedColors?.[0] || ''} className={field} style={{ color: NAVY }}
                            onChange={e => setItem(idx, {
                              selectedColors: e.target.value ? [e.target.value] : [],
                            })}>
                            <option value="">Choisir une couleur…</option>
                            {/* Le site enregistre le nom dans la langue du
                                client : on conserve la valeur telle quelle. */}
                            {it.selectedColors?.[0]
                              && !p.colors.some(h => colorName(h) === it.selectedColors[0]) && (
                              <option value={it.selectedColors[0]}>{it.selectedColors[0]}</option>
                            )}
                            {p.colors.map(hex => (
                              <option key={hex} value={colorName(hex)}>{colorName(hex)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Nombre de couleurs du design — option payante du site */}
                    {p?.colorDesignEnabled && (
                      <div className="p-3 rounded-xl border-2"
                        style={{ borderColor: PURPLE, background: 'rgba(124,58,237,0.04)' }}>
                        <p className={label}>Nombre de couleurs</p>
                        <div className="flex items-center gap-3">
                          <button type="button"
                            onClick={() => setPricedItem(idx, { numberOfColors: Math.max(1, Number(it.numberOfColors) - 1) })}
                            className="w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: PURPLE, color: 'white' }}>−</button>
                          <span className="flex-1 text-center font-black text-lg" style={{ color: NAVY }}>
                            {it.numberOfColors}
                          </span>
                          <button type="button"
                            onClick={() => setPricedItem(idx, {
                              numberOfColors: p.colorDesignMaxColors
                                ? Math.min(p.colorDesignMaxColors, Number(it.numberOfColors) + 1)
                                : Number(it.numberOfColors) + 1,
                            })}
                            className="w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: PURPLE, color: 'white' }}>+</button>
                        </div>
                        <p className="text-[11px] mt-1.5" style={{ color: PURPLE }}>
                          +{money(p.colorDesignPricePerColor)} DA par couleur supplémentaire
                          {p.colorDesignMaxColors ? ` — ${p.colorDesignMaxColors} au maximum` : ''}
                        </p>
                      </div>
                    )}

                    {/* Recto-verso — option payante du site */}
                    {p?.doubleSided && (
                      <Toggle on={it.doubleSided}
                        onChange={v => setPricedItem(idx, { doubleSided: v })}
                        title="Impression recto-verso"
                        hint={p.doubleSidedPrice > 0
                          ? `+${money(p.doubleSidedPrice)} DA / unité`
                          : 'Inclus'} />
                    )}

                    {/* Couleurs relevées par la confirmatrice — le designer
                        et la production s'y réfèrent pour fabriquer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <ColorField id={`bag-color-${idx}`} label="Couleur du sac"
                        value={it.bagColor || ''}
                        onChange={v => setItem(idx, { bagColor: v })} />
                      <ColorField id={`print-color-${idx}`} label="Couleur de l'impression"
                        value={it.printColor || ''}
                        onChange={v => setItem(idx, { printColor: v })} />
                    </div>

                    {/* Prix — calculé comme sur le site, forçable si négocié */}
                    <div className="flex items-end gap-2 pt-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-400">
                          Prix du site :{' '}
                          <span className="font-bold" style={{ color: NAVY }}>{money(L.unitPrice)} DA/u</span>
                          {L.extraDouble > 0 && <span> · recto-verso +{money(L.extraDouble)}</span>}
                          {L.extraColors > 0 && <span> · {L.nbColors} couleurs +{money(L.extraColors)}</span>}
                          {L.hasTiers && <span> · palier {Number(it.quantity) || 0}</span>}
                        </p>
                        {L.forced && L.unit !== L.unitPrice && (
                          <p className="text-[11px] font-bold" style={{ color: '#b45309' }}>
                            Prix forcé à {money(L.unit)} DA/u
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={label}>Prix unitaire</label>
                        <input type="number" min="0" value={it.priceOverride}
                          placeholder={String(L.unitPrice)}
                          className="w-24 px-2 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-right outline-none focus:border-purple-400"
                          style={{ color: NAVY }}
                          onChange={e => setItem(idx, { priceOverride: e.target.value })} />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                        className="p-2 mb-0.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 text-right">
                      Sous-total : <span className="font-bold" style={{ color: NAVY }}>
                        {money(L.lineTotal)} DA
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
                  Articles {money(itemsTotal)} DA
                  {deliveryFee != null && ` + livraison ${money(deliveryFee)} DA`}
                  {' = '}<span className="font-bold" style={{ color: NAVY }}>{money(computed)} DA</span>
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
