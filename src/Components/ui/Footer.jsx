import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'

const ROSE = '#b08898'
const ROSE_SOFT = 'rgba(176,136,152,0.6)'
const ROSE_XSOFT = 'rgba(176,136,152,0.35)'

function AdminSecretAccess() {
  const [clicks, setClicks]       = useState(0)
  const [showInput, setShowInput] = useState(false)
  const [value, setValue]         = useState('')
  const navigate = useNavigate()

  const handleClick = () => {
    const next = clicks + 1
    setClicks(next)
    if (next >= 3) { setShowInput(true); setClicks(0) }
  }

  const handleChange = (e) => {
    const val = e.target.value
    setValue(val)
    if (val.toLowerCase() === 'admin') {
      setShowInput(false); setValue(''); navigate('/admin/login')
    }
  }

  return (
    <div className="relative inline-block">
      <span onClick={handleClick} className="cursor-default select-none">©</span>
      {showInput && (
        <input autoFocus type="text" value={value} onChange={handleChange}
          onBlur={() => { setShowInput(false); setValue(''); setClicks(0) }}
          className="absolute bottom-6 right-0 w-24 text-white text-xs px-2 py-1 rounded-lg outline-none"
          style={{ background: '#4b2038', border: `1px solid ${ROSE_XSOFT}` }}
          placeholder="..." />
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-charcoal" style={{ borderTop: `1px solid rgba(176,136,152,0.2)` }}>

      {/* ── Contenu principal ── */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Colonne 1 — Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <img src="/logo.jpg" alt="BrandPack" className="w-10 h-10 rounded-full object-contain" />
            <span className="text-white text-xl font-black italic">BrandPack</span>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: ROSE_SOFT }}>
            BrandPack est votre spécialiste de l'emballage en Algérie. Nous proposons
            des cartons, sacs, cartes et papiers de qualité pour les professionnels
            et particuliers partout sur le territoire national.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: ROSE_XSOFT }}>
            Paiement à la livraison · Expédition dans les 58 wilayas · Service client réactif.
          </p>
        </div>

        {/* Colonne 2 — Liens rapides */}
        <div>
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: ROSE }}>
            Liens rapides
          </p>
          <ul className="space-y-3">
            {[
              { to: '/',                              label: 'Accueil' },
              { to: '/products?category=Bags',        label: 'Sacs' },
              { to: '/products?category=Board',       label: 'Boites & Cartons' },
              { to: '/products?category=Autocollants',label: 'Cartes' },
              { to: '/products?category=Paper',       label: 'Papier' },
            ].map(({ to, label }) => (
              <li key={label}>
                <Link to={to}
                  className="text-sm flex items-center gap-2 transition-colors duration-200"
                  style={{ color: ROSE_SOFT }}
                  onMouseEnter={e => e.currentTarget.style.color = ROSE}
                  onMouseLeave={e => e.currentTarget.style.color = ROSE_SOFT}>
                  <span style={{ color: ROSE }} className="text-xs">→</span> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 3 — Contact */}
        <div>
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: ROSE }}>
            Contact
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Mail size={15} style={{ color: ROSE }} className="mt-0.5 flex-shrink-0" />
              <a href="mailto:contact@brandpack.dz"
                className="text-sm transition-colors"
                style={{ color: ROSE_SOFT }}>
                contact@brandpack.dz
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={15} style={{ color: ROSE }} className="mt-0.5 flex-shrink-0" />
              <a href="tel:+213XXXXXXXXX"
                className="text-sm transition-colors"
                style={{ color: ROSE_SOFT }}>
                +213 XX XX XX XX XX
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={15} style={{ color: ROSE }} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm" style={{ color: ROSE_SOFT }}>
                Alger, Algérie<br />
                Livraison dans les 58 wilayas
              </span>
            </li>
          </ul>
        </div>

        {/* Colonne 4 — Aide */}
        <div>
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: ROSE }}>
            Vous avez besoin d'aide ?
          </p>
          <p className="text-sm leading-relaxed mb-5" style={{ color: ROSE_SOFT }}>
            Notre équipe est disponible pour répondre à toutes vos questions sur
            nos produits, commandes et livraisons.
          </p>
          <a href="https://wa.me/213XXXXXXXXX"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white font-bold text-sm
                       px-5 py-3 rounded-full transition-all hover:scale-105 shadow-dark"
            style={{ background: '#25D366' }}>
            <MessageCircle size={16} />
            Contacter sur WhatsApp
          </a>
        </div>
      </div>

      {/* ── Séparateur ── */}
      <div style={{ borderTop: `1px solid rgba(176,136,152,0.15)` }} />

      {/* ── Bas de footer ── */}
      <div className="max-w-7xl mx-auto px-6 py-5
                      flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs" style={{ color: ROSE_XSOFT }}>
          <AdminSecretAccess /> {new Date().getFullYear()} BrandPack. Tous droits réservés.
        </p>
        <a href="https://www.instagram.com/cvkdev/"
          target="_blank" rel="noopener noreferrer"
          className="text-xs transition-colors"
          style={{ color: ROSE_XSOFT }}>
          Developed by <span style={{ color: ROSE }} className="font-bold">CvkDev</span>
        </a>
      </div>

    </footer>
  )
}

export default Footer