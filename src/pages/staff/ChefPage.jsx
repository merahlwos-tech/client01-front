import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Palette, Sun, Hammer, Package, Truck, Boxes,
  CheckCheck, XCircle, Loader2, ArrowRight, Eye, Pencil,
  LayoutGrid, BarChart3,
} from 'lucide-react'
import staffApi from '../../utils/staffApi'
import { PageHeader } from '../../Components/staff/StageBoard'
import WorkshopStats from '../../Components/staff/WorkshopStats'
import { STAGES, NAVY, PURPLE } from '../../Components/staff/staffConfig'

/* Le chef supervise toutes les étapes ; il n'agit que sur le stock,
   la planification de fabrication et la livraison. */
// `?chef=1` fait entrer le chef en mode étendu : il garde ses prérogatives
// (modifier le planning de fabrication) même à l'intérieur d'un service.
const SERVICES = [
  { key: 'confirmation', to: '/confirmatrice?chef=1', icon: CheckCircle2, label: 'Confirmation', access: 'voir' },
  { key: 'design',       to: '/designer?chef=1',      icon: Palette,      label: 'Design',       access: 'voir' },
  { key: 'insolation',   to: '/insolation?chef=1',    icon: Sun,          label: 'Insolation',   access: 'voir' },
  { key: 'production',   to: '/production?chef=1',    icon: Hammer,       label: 'Production',   access: 'planifier' },
  { key: 'emballage',    to: '/emballage?chef=1',     icon: Package,      label: 'Emballage',    access: 'voir' },
  { key: 'livraison',    to: '/livraison?chef=1',     icon: Truck,        label: 'Livraison',    access: 'gerer' },
]

const ACCESS = {
  voir:      { label: 'Consultation', icon: Eye,    color: '#6b7280', bg: '#f3f4f6' },
  planifier: { label: 'Replanifier',  icon: Pencil, color: '#2563eb', bg: '#eff6ff' },
  gerer:     { label: 'Gestion',      icon: Pencil, color: '#10b981', bg: '#ecfdf5' },
}

const VUES = [
  { key: 'services', label: 'Supervision',   icon: LayoutGrid },
  { key: 'stats',    label: 'Statistiques',  icon: BarChart3 },
]

function ChefPage() {
  const [vue, setVue]         = useState('services')
  const [stats, setStats]     = useState(null)
  const [stock, setStock]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      staffApi.get('/workflow/stats').then(r => setStats(r.data)).catch(() => {}),
      staffApi.get('/stock/stats').then(r => setStock(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader eyebrow="Chef de production"
        title={vue === 'stats' ? 'Statistiques' : 'Supervision'} />

      <div className="flex flex-wrap gap-2">
        {VUES.map(v => {
          const Icon = v.icon
          const active = vue === v.key
          return (
            <button key={v.key} onClick={() => setVue(v.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: active ? PURPLE : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
              <Icon size={15} /> {v.label}
            </button>
          )
        })}
      </div>

      {vue === 'stats' ? <WorkshopStats /> : loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* ── Les services, avec le niveau d'accès du chef ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Les services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SERVICES.map(({ key, to, icon: Icon, label, access }) => {
                const cfg  = STAGES[key] || {}
                const acc  = ACCESS[access]
                const AccIcon = acc.icon
                return (
                  <Link key={key} to={to}
                    className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                        <Icon size={17} style={{ color: cfg.color }} />
                      </div>
                      <ArrowRight size={14} className="text-gray-300" />
                    </div>
                    <p className="text-2xl font-black" style={{ color: cfg.color }}>
                      {stats?.[key] ?? 0}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: acc.bg, color: acc.color }}>
                      <AccIcon size={10} /> {acc.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ── Stock : la seule zone qu'il modifie librement ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Stock — vous êtes le seul à pouvoir le modifier
            </p>
            <Link to="/stock"
              className="block bg-white rounded-2xl p-5 border-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Boxes size={20} style={{ color: PURPLE }} />
                </div>
                <div className="flex gap-6 flex-1 flex-wrap">
                  <div>
                    <p className="text-xl font-black" style={{ color: NAVY }}>{stock?.totalMaterials ?? 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Matières</p>
                  </div>
                  <div>
                    <p className="text-xl font-black" style={{ color: '#059669' }}>
                      {(stock?.totalUnits ?? 0).toLocaleString('fr-DZ')}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Unités</p>
                  </div>
                  <div>
                    <p className="text-xl font-black" style={{ color: '#f59e0b' }}>{stock?.lowStockCount ?? 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Stock bas</p>
                  </div>
                  <div>
                    <p className="text-xl font-black" style={{ color: '#ef4444' }}>{stock?.outOfStockCount ?? 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Ruptures</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </div>
            </Link>
          </div>

          {/* ── Commandes clôturées ── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'termine', icon: CheckCheck, label: 'Terminées' },
              { key: 'annulee', icon: XCircle,    label: 'Annulées' },
            ].map(({ key, icon: Icon, label }) => {
              const cfg = STAGES[key]
              return (
                <div key={key} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: cfg.bg }}>
                    <Icon size={17} style={{ color: cfg.color }} />
                  </div>
                  <p className="text-2xl font-black" style={{ color: cfg.color }}>{stats?.[key] ?? 0}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default ChefPage
