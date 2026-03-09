import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'

const NAVY         = '#1e1b4b'
const PURPLE       = '#7c3aed'
const PURPLE_SOFT  = 'rgba(124,58,237,0.65)'
const PURPLE_XSOFT = 'rgba(124,58,237,0.3)'
const WHITE_SOFT   = 'rgba(255,255,255,0.6)'
const WHITE_XSOFT  = 'rgba(255,255,255,0.35)'

function AdminSecretAccess() {
  const [clicks, setClicks]       = useState(0)
  const [showInput, setShowInput] = useState(false)
  const [value, setValue]         = useState('')
  const navigate = useNavigate()

  const handleClick = () => {
    const next = clicks + 1; setClicks(next)
    if (next >= 3) { setShowInput(true); setClicks(0) }
  }
  const handleChange = (e) => {
    setValue(e.target.value)
    if (e.target.value.toLowerCase() === 'admin') {
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
          style={{ background: NAVY, border: `1px solid ${PURPLE_XSOFT}` }}
          placeholder="..." />
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#2d2a6e', borderTop: `1px solid ${PURPLE_XSOFT}` }}>

      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <img src="/logo.jpg" alt="BrandPack" className="w-10 h-10 rounded-full object-contain" />
            <span className="text-white text-xl font-black italic">BrandPack</span>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: WHITE_SOFT }}>
            BrandPack est votre spécialiste de l'emballage en Algérie. Cartons, sacs,
            cartes et papiers de qualité pour professionnels et particuliers partout
            sur le territoire national.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: WHITE_XSOFT }}>
            Paiement à la livraison · 58 wilayas · Service client réactif.
          </p>
        </div>

        {/* Liens rapides */}
        <div>
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
            Liens rapides
          </p>
          <ul className="space-y-3">
            {[
              { to: '/',                               label: 'Accueil' },
              { to: '/products?category=Bags',         label: 'Sacs' },
              { to: '/products?category=Board',        label: 'Boites & Cartons' },
              { to: '/products?category=Autocollants', label: 'Cartes' },
              { to: '/products?category=Paper',        label: 'Papier' },
            ].map(({ to, label }) => (
              <li key={label}>
                <Link to={to} className="text-sm flex items-center gap-2 transition-colors"
                  style={{ color: WHITE_SOFT }}>
                  <span style={{ color: PURPLE }} className="text-xs">→</span> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
            Contact
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Mail size={15} style={{ color: PURPLE }} className="mt-0.5 flex-shrink-0" />
              <a href="mailto:contact@brandpack.dz" className="text-sm" style={{ color: WHITE_SOFT }}>
                contact@brandpack.dz
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={15} style={{ color: PURPLE }} className="mt-0.5 flex-shrink-0" />
              <a href="tel:+213XXXXXXXXX" className="text-sm" style={{ color: WHITE_SOFT }}>
                +213 XX XX XX XX XX
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={15} style={{ color: PURPLE }} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm" style={{ color: WHITE_SOFT }}>
                Alger, Algérie<br />
                Livraison dans les 58 wilayas
              </span>
            </li>
          </ul>
        </div>

        {/* Aide */}
        <div>
          <p className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: PURPLE }}>
            Vous avez besoin d'aide ?
          </p>
          <p className="text-sm leading-relaxed mb-5" style={{ color: WHITE_SOFT }}>
            Notre équipe est disponible pour répondre à toutes vos questions sur
            nos produits, commandes et livraisons.
          </p>
          <a href="https://wa.me/213XXXXXXXXX" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white font-bold text-sm
                       px-5 py-3 rounded-full transition-all hover:scale-105 shadow-lg"
            style={{ background: '#25D366' }}>
            <MessageCircle size={16} />
            Contacter sur WhatsApp
          </a>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${PURPLE_XSOFT}` }} />

      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs" style={{ color: WHITE_XSOFT }}>
          <AdminSecretAccess /> {new Date().getFullYear()} BrandPack. Tous droits réservés.
        </p>
        <a href="https://www.instagram.com/cvkdev/" target="_blank" rel="noopener noreferrer"
          className="text-xs" style={{ color: WHITE_XSOFT }}>
          Developed by <span style={{ color: PURPLE }} className="font-bold">CvkDev</span>
        </a>
      </div>
    </footer>
  )
}

export default Footer