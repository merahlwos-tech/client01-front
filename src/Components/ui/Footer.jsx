import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'

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
          className="absolute bottom-6 right-0 w-24 bg-mauve border border-gold/30
                     text-white text-xs px-2 py-1 rounded-lg outline-none shadow-fairy"
          placeholder="..." />
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-charcoal border-t border-mauve/30">

      {/* ── Contenu principal ── */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Colonne 1 — Brand + description */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-mauve rounded-full flex items-center
                            justify-center shadow-fairy flex-shrink-0">
              <span className="font-display text-gold text-lg font-black italic">B</span>
            </div>
            <span className="text-white text-xl font-black italic">BrandPack</span>
          </div>
          <p className="text-gold/60 text-sm leading-relaxed mb-4">
            BrandPack est votre spécialiste de l'emballage en Algérie. Nous proposons
            des cartons, sacs, autocollants et papiers de qualité pour les professionnels
            et particuliers partout sur le territoire national.
          </p>
          <p className="text-gold/40 text-xs leading-relaxed">
            Paiement à la livraison · Expédition dans les 58 wilayas · Service client réactif.
          </p>
        </div>

        {/* Colonne 2 — Liens rapides */}
        <div>
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-5">
            Liens rapides
          </p>
          <ul className="space-y-3">
            <li>
              <Link to="/"
                className="text-gold/60 text-sm hover:text-gold transition-colors flex items-center gap-2">
                <span className="text-primary text-xs">→</span> Accueil
              </Link>
            </li>
            <li>
              <Link to="/products?category=Bags"
                className="text-gold/60 text-sm hover:text-gold transition-colors flex items-center gap-2">
                <span className="text-primary text-xs">→</span> Sacs
              </Link>
            </li>
            <li>
              <Link to="/products?category=Board"
                className="text-gold/60 text-sm hover:text-gold transition-colors flex items-center gap-2">
                <span className="text-primary text-xs">→</span> Boîtes & Cartons
              </Link>
            </li>
            <li>
              <Link to="/products?category=Autocollants"
                className="text-gold/60 text-sm hover:text-gold transition-colors flex items-center gap-2">
                <span className="text-primary text-xs">→</span> Stickers
              </Link>
            </li>
            <li>
              <Link to="/products?category=Paper"
                className="text-gold/60 text-sm hover:text-gold transition-colors flex items-center gap-2">
                <span className="text-primary text-xs">→</span> Papier
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 — Contact */}
        <div>
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-5">
            Contact
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Mail size={15} className="text-gold mt-0.5 flex-shrink-0" />
              <a href="mailto:contact@brandpack.dz"
                className="text-gold/60 text-sm hover:text-gold transition-colors">
                contact@brandpack.dz
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={15} className="text-gold mt-0.5 flex-shrink-0" />
              <a href="tel:+213XXXXXXXXX"
                className="text-gold/60 text-sm hover:text-gold transition-colors">
                +213 XX XX XX XX XX
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={15} className="text-gold mt-0.5 flex-shrink-0" />
              <span className="text-gold/60 text-sm">
                Alger, Algérie<br />
                Livraison dans les 58 wilayas
              </span>
            </li>
          </ul>
        </div>

        {/* Colonne 4 — Besoin d'aide */}
        <div>
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-5">
            Vous avez besoin d'aide ?
          </p>
          <p className="text-gold/60 text-sm leading-relaxed mb-5">
            Notre équipe est disponible pour répondre à toutes vos questions sur
            nos produits, commandes et livraisons.
          </p>
          <a
            href="https://wa.me/213XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d]
                       text-white font-bold text-sm px-5 py-3 rounded-full
                       transition-all hover:scale-105 shadow-dark">
            <MessageCircle size={16} />
            Contacter sur WhatsApp
          </a>
        </div>
      </div>

      {/* ── Séparateur ── */}
      <div className="border-t border-mauve/20" />

      {/* ── Bas de footer ── */}
      <div className="max-w-7xl mx-auto px-6 py-5
                      flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-gold/40 text-xs">
          <AdminSecretAccess /> {new Date().getFullYear()} BrandPack. Tous droits réservés.
        </p>
        <a
          href="https://www.instagram.com/cvkdev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold/40 text-xs hover:text-gold transition-colors">
          Developed by <span className="text-primary font-bold">CvkDev</span>
        </a>
      </div>

    </footer>
  )
}

export default Footer