// src/Components/staff/useEcotrack.js
// Wilayas, communes et tarifs de livraison Ecotrack — les mêmes données que
// le formulaire du site, pour que la confirmatrice facture exactement ce que
// le client aurait payé. Le cache de session est partagé avec la boutique
// (mêmes clés), donc les listes sont déjà chaudes la plupart du temps.

import { useState, useEffect, useCallback } from 'react'
import staffApi from '../../utils/staffApi'
import { wilayas as LOCAL_WILAYAS } from '../../data/wilayas'

const LOCAL_FORMATTED = LOCAL_WILAYAS.map(w => ({
  wilaya_id: w.code, wilaya_name: w.name,
}))

function ssGet(key) {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null }
  catch { return null }
}
function ssSet(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)) } catch { /* quota / mode privé */ }
}

export default function useEcotrack() {
  const [wilayas, setWilayas]   = useState([])
  const [fees, setFees]         = useState([])
  const [communes, setCommunes] = useState([])
  const [loadingW, setLoadingW] = useState(false)
  const [loadingC, setLoadingC] = useState(false)

  useEffect(() => {
    const cachedW = ssGet('eco_wilayas_v2')
    const cachedF = ssGet('eco_fees_v2')
    if (cachedW?.length && cachedF) { setWilayas(cachedW); setFees(cachedF); return }

    let alive = true
    setLoadingW(true)
    Promise.all([
      staffApi.get('/ecotrack/wilayas').then(r => r.data).catch(() => null),
      staffApi.get('/ecotrack/fees').then(r => r.data).catch(() => null),
    ]).then(([w, f]) => {
      if (!alive) return
      let list = Array.isArray(w) ? w : (w?.data || [])
      // Ecotrack indisponible : on retombe sur la liste locale des wilayas.
      if (!list.length) list = LOCAL_FORMATTED
      const sorted = [...list].sort((a, b) => Number(a.wilaya_id) - Number(b.wilaya_id))
      const fList = Array.isArray(f) ? f : (f?.livraison || f?.data || [])
      setWilayas(sorted); ssSet('eco_wilayas_v2', sorted)
      setFees(fList);     ssSet('eco_fees_v2', fList)
    }).finally(() => { if (alive) setLoadingW(false) })

    return () => { alive = false }
  }, [])

  const loadCommunes = useCallback((id) => {
    if (!id) { setCommunes([]); return }
    const key = `eco_communes_v2_${id}`
    const cached = ssGet(key)
    if (cached) { setCommunes(cached); return }

    setLoadingC(true)
    staffApi.get('/ecotrack/communes', { params: { wilaya_id: id } })
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data || [])
        const sorted = [...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
        setCommunes(sorted); ssSet(key, sorted)
      })
      .catch(() => setCommunes([]))
      .finally(() => setLoadingC(false))
  }, [])

  const feesForWilaya = useCallback(
    (id) => fees.find(f => String(f.wilaya_id) === String(id)) || null,
    [fees]
  )

  return { wilayas, communes, fees, loadingW, loadingC, loadCommunes, feesForWilaya }
}
