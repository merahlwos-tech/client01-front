// src/Components/staff/WorkshopStats.jsx
// Tableau de bord de l'atelier, réservé au chef de production et au superadmin.
// Chaque bloc répond à une question qu'on se pose vraiment : est-ce qu'on tient
// les délais, où ça bloque, qu'est-ce qui part, et que faut-il racheter.

import { useState, useEffect } from 'react'
import {
  Loader2, TrendingUp, Timer, AlertTriangle, Boxes, MapPin, Package,
  CalendarDays, Activity, Gauge,
} from 'lucide-react'
import staffApi from '../../utils/staffApi'
import { NAVY, PURPLE, STAGES, formatDayLabel } from './staffConfig'

const PERIODES = [
  { days: 7,  label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '3 mois' },
]

const money = (n) => Number(n || 0).toLocaleString('fr-DZ')

/* Un délai se lit en heures tant qu'il tient dans la journée, en jours ensuite */
function fmtDuree(h) {
  if (h == null || Number.isNaN(h)) return '—'
  if (h < 1)  return `${Math.round(h * 60)} min`
  if (h < 48) return `${Math.round(h)} h`
  return `${(h / 24).toFixed(1)} j`
}

/* Âge de la commande la plus ancienne encore à cette étape */
function ageJours(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function Card({ label, value, sub, color = NAVY, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      {Icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{ background: color + '14' }}>
          <Icon size={15} style={{ color }} />
        </div>
      )}
      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Section({ title, icon: Icon, children, hint }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"
        style={{ color: PURPLE }}>
        {Icon && <Icon size={13} />} {title}
      </p>
      {hint && <p className="text-[11px] text-gray-400 mb-2">{hint}</p>}
      <div className={hint ? '' : 'mt-2'}>{children}</div>
    </div>
  )
}

/* Barre proportionnelle : la plus grosse valeur occupe toute la largeur */
function BarRow({ label, value, max, suffix = '', color = PURPLE, right }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs truncate w-28 sm:w-40 flex-shrink-0" style={{ color: NAVY }}>{label}</span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-24 text-right flex-shrink-0" style={{ color: NAVY }}>
        {right != null ? right : `${money(value)}${suffix}`}
      </span>
    </div>
  )
}

function WorkshopStats({ showRevenue = true }) {
  const [days, setDays]       = useState(30)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    // Le fuseau de l'atelier découpe les journées : sans lui, une commande
    // enregistrée à 23 h basculerait sur la veille.
    const offset = -new Date().getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const pad  = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0')
    const tz   = `${sign}${pad(offset / 60)}:${pad(offset % 60)}`

    staffApi.get('/workflow/dashboard', { params: { days, tz } })
      .then(r => { if (alive) setData(r.data) })
      .catch(() => { if (alive) setData(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [days])

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Chargement des statistiques…
      </div>
    )
  }
  if (!data) {
    return <p className="text-sm text-gray-400 py-6 text-center">Statistiques indisponibles.</p>
  }

  const { flux, delais, respectDelai, etapes, topProduits, topWilayas, stock, serie, charge } = data

  const serieMax   = Math.max(1, ...serie.map(d => Math.max(d.recues, d.fabriquees)))
  const chargeMax  = Math.max(1, ...charge.map(c => c.total))
  const produitMax = Math.max(1, ...topProduits.map(p => p.pieces))
  const wilayaMax  = Math.max(1, ...topWilayas.map(w => w.commandes))

  const etapesOrdre = ['confirmation', 'design', 'production', 'emballage', 'livraison']
  const totalRetard = etapesOrdre.reduce((s, k) => s + (etapes[k]?.enRetard || 0), 0)

  const ETAPES_DELAI = [
    { key: 'confirmationDesign',   label: 'Confirmation → design traité' },
    { key: 'designEnvoi',          label: 'Design traité → envoi atelier' },
    { key: 'envoiFabrication',     label: 'Envoi → fabrication finie' },
    { key: 'fabricationEmballage', label: 'Fabrication → emballage' },
    { key: 'emballageLivraison',   label: 'Emballage → livraison' },
  ]
  const delaiMax = delais
    ? Math.max(1, ...ETAPES_DELAI.map(e => delais[e.key] || 0))
    : 1

  return (
    <div className="space-y-7">

      {/* Période */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODES.map(p => (
          <button key={p.days} onClick={() => setDays(p.days)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: days === p.days ? PURPLE : '#f3f4f6',
                     color: days === p.days ? 'white' : '#6b7280' }}>
            {p.label}
          </button>
        ))}
        {loading && <Loader2 size={14} className="animate-spin text-gray-300" />}
      </div>

      {/* ── Chiffres clés ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card label="Reçues"     value={flux.recues}     icon={TrendingUp} color={PURPLE} />
        <Card label="Confirmées" value={flux.confirmees} icon={Activity}   color="#10b981"
          sub={flux.tauxConfirmation != null ? `${flux.tauxConfirmation} % des décisions` : null} />
        <Card label="Fabriquées" value={flux.fabriquees} icon={Package}    color="#3b82f6"
          sub={`${money(flux.pieces)} pièces`} />
        <Card label="Annulées"   value={flux.annulees}   icon={AlertTriangle} color="#ef4444" />
        {showRevenue && (
          <>
            <Card label="Chiffre d'affaires" value={`${money(flux.ca)} DA`} color={PURPLE}
              sub="commandes confirmées" />
            <Card label="Panier moyen" value={`${money(flux.panierMoyen)} DA`} color={NAVY} />
          </>
        )}
        <Card label="Délai tenu"
          value={respectDelai.taux != null ? `${respectDelai.taux} %` : '—'}
          icon={Gauge}
          color={respectDelai.taux == null ? '#9ca3af'
               : respectDelai.taux >= 80 ? '#10b981'
               : respectDelai.taux >= 50 ? '#f59e0b' : '#ef4444'}
          sub={respectDelai.total
            ? `${respectDelai.aTemps}/${respectDelai.total} avant échéance`
            : 'aucune fabrication'} />
        <Card label="En retard" value={totalRetard} icon={Timer}
          color={totalRetard > 0 ? '#ef4444' : '#10b981'}
          sub="échéance dépassée, en cours" />
      </div>

      {/* ── Où sont les commandes ── */}
      <Section title="Où ça bloque" icon={AlertTriangle}
        hint="Commandes encore en circuit, avec l'âge de la plus ancienne de chaque étape.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {etapesOrdre.map(key => {
            const e   = etapes[key]
            const cfg = STAGES[key]
            const age = ageJours(e?.plusAncienne)
            return (
              <div key={key} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold" style={{ color: NAVY }}>{cfg.label}</p>
                  <p className="text-[11px] text-gray-400">
                    {age != null ? `plus ancienne : ${age} j` : 'rien en attente'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black leading-none" style={{ color: cfg.color }}>
                    {e?.total || 0}
                  </p>
                  <div className="flex gap-1 justify-end mt-1">
                    {e?.urgentes > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fffbeb', color: '#b45309' }}>
                        {e.urgentes} urg.
                      </span>
                    )}
                    {e?.enRetard > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fef2f2', color: '#ef4444' }}>
                        {e.enRetard} retard
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Temps passé à chaque étape ── */}
      {delais && (
        <Section title="Temps moyen par étape" icon={Timer}
          hint={`Sur les commandes confirmées ces ${data.periodeJours} jours. Bout en bout : ${fmtDuree(delais.bout)}.`}>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2.5">
            {ETAPES_DELAI.map(e => (
              <BarRow key={e.key} label={e.label} value={delais[e.key] || 0} max={delaiMax}
                right={fmtDuree(delais[e.key])}
                color={delais[e.key] > 48 ? '#f59e0b' : PURPLE} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Activité jour par jour ── */}
      <Section title="Activité jour par jour" icon={Activity}
        hint="Violet : commandes reçues. Bleu : fabrications terminées.">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-end gap-[3px] h-24 overflow-x-auto">
            {serie.map(d => (
              <div key={d.date} className="flex-1 min-w-[4px] flex flex-col justify-end gap-[2px]"
                title={`${d.date} — ${d.recues} reçue(s), ${d.fabriquees} fabriquée(s)`}>
                <div style={{ height: `${(d.recues / serieMax) * 60}%`, background: PURPLE }}
                  className="rounded-sm" />
                <div style={{ height: `${(d.fabriquees / serieMax) * 40}%`, background: '#3b82f6' }}
                  className="rounded-sm" />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
            <span>{serie[0]?.date}</span>
            <span>{serie[serie.length - 1]?.date}</span>
          </div>
        </div>
      </Section>

      {/* ── Charge à venir ── */}
      <Section title="Charge de fabrication à venir" icon={CalendarDays}
        hint="Les 14 prochains jours, d'après le planning du designer.">
        {charge.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-2xl p-4 border border-gray-100">
            Aucune fabrication planifiée.
          </p>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
            {charge.map(c => (
              <BarRow key={c.date} label={formatDayLabel(c.date)} value={c.total} max={chargeMax}
                color={c.urgent > 0 ? '#ef4444' : '#3b82f6'}
                right={`${c.total} cde · ${money(c.pieces)} p.`} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Stock : ce qu'il faut racheter ── */}
      <Section title="Couverture du stock" icon={Boxes}
        hint="Au rythme de consommation mesuré sur la période, nombre de jours restants.">
        {stock.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-2xl p-4 border border-gray-100">
            Aucune matière en stock.
          </p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {stock.map(m => {
              const c = m.couvertureJours
              const couleur = c == null ? '#9ca3af'
                : c <= 7 ? '#ef4444' : c <= 21 ? '#f59e0b' : '#10b981'
              return (
                <div key={m.name} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: NAVY }}>{m.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {money(m.quantity)} {m.unit} en stock
                      {m.consomme > 0 && ` · ${money(m.consomme)} consommé${m.consomme > 1 ? 's' : ''} · ${m.parJour}/jour`}
                    </p>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ background: couleur + '18', color: couleur }}>
                    {c == null ? 'pas de conso' : c === 0 ? 'épuisé' : `${c} j`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Ce qui se vend, et où ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Produits les plus commandés" icon={Package}>
          {topProduits.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-2xl p-4 border border-gray-100">
              Aucune commande sur la période.
            </p>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2.5">
              {topProduits.map(p => (
                <BarRow key={p._id} label={p._id} value={p.pieces} max={produitMax}
                  right={`${money(p.pieces)} p.`} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Wilayas les plus servies" icon={MapPin}>
          {topWilayas.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-2xl p-4 border border-gray-100">
              Aucune commande sur la période.
            </p>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2.5">
              {topWilayas.map(w => (
                <BarRow key={w._id || 'inconnue'} label={w._id || 'Non renseignée'}
                  value={w.commandes} max={wilayaMax} color="#0ea5e9"
                  right={`${w.commandes} cde${w.commandes > 1 ? 's' : ''}`} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

export default WorkshopStats
