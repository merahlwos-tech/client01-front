// src/Components/staff/StandaloneLayout.jsx
// Enveloppe d'une page de service AUTONOME.
//
// Contrairement à StaffLayout (hub avec barre latérale listant tous les
// services), cette enveloppe n'affiche QUE le service concerné : aucun menu,
// aucun lien vers les autres panels. Chaque employé reçoit son URL et ne voit
// que son propre poste de travail.

import { useEffect } from 'react'
import OrderSearch from './OrderSearch'
import { NAVY } from './staffConfig'

function StandaloneLayout({ label, children }) {
  /* L'atelier est toujours en français / LTR, même si le site public
     est affiché en arabe (dir=rtl posé par LanguageProvider). */
  useEffect(() => {
    const prevDir  = document.documentElement.dir
    const prevLang = document.documentElement.lang
    document.documentElement.dir  = 'ltr'
    document.documentElement.lang = 'fr'
    return () => {
      document.documentElement.dir  = prevDir
      document.documentElement.lang = prevLang
    }
  }, [])

  /* Titre d'onglet = nom du service (repérage facile entre onglets) */
  useEffect(() => {
    const prev = document.title
    document.title = `${label} — BrandPack`
    return () => { document.title = prev }
  }, [label])

  return (
    <div dir="ltr" className="min-h-screen flex flex-col" style={{ background: '#f5f3ff' }}>

      {/* En-tête minimal : identité du service, sans navigation */}
      <header
        className="sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center gap-3"
        style={{ background: NAVY, borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
        <img src="/icon.webp" alt=""
          className="w-8 h-8 rounded-full object-contain flex-shrink-0"
          onError={e => { e.currentTarget.style.display = 'none' }} />
        <div className="min-w-0">
          <p className="text-white font-black italic text-sm leading-none truncate">BrandPack</p>
          <p className="text-[11px] mt-0.5 font-bold uppercase tracking-widest truncate"
            style={{ color: '#a78bfa' }}>
            {label}
          </p>
        </div>

        {/* Recherche transverse : retrouver une commande où qu'elle soit */}
        <div className="ml-auto w-full max-w-xs hidden sm:block">
          <OrderSearch compact />
        </div>
      </header>

      {/* Sur mobile la recherche passe sous l'en-tête, faute de place */}
      <div className="sm:hidden px-3 pt-3">
        <OrderSearch />
      </div>

      <main className="flex-1 p-3 sm:p-5 lg:p-6 min-w-0">
        {children}
      </main>
    </div>
  )
}

export default StandaloneLayout
