import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// Couleur rose mauve douce uniforme
const ROSE = '#b08898'
const ROSE_SOFT = 'rgba(176,136,152,0.7)'
const ROSE_XSOFT = 'rgba(176,136,152,0.45)'

const CAT_IMAGES = [
  { label: 'Boites',  cat: 'Board',        image: '/boite.png' },
  { label: 'Sacs',    cat: 'Bags',         image: '/sacs.png' },
  { label: 'Cartes',  cat: 'Autocollants', image: '/carte.png' },
  { label: 'Papier',  cat: 'Paper',        image: '/papier.png' },
]

const STEPS = [
  {
    n: '1',
    title: 'Choisissez votre produit',
    desc: 'Parcourez nos catégories et choisissez le produit qui correspond à vos besoins, puis précisez la taille et la quantité.',
  },
  {
    n: '2',
    title: 'Personnalisez votre design',
    desc: "Téléchargez votre propre fichier de conception et choisissez le nombre de couleurs ainsi que les autres options d'impression.",
  },
  {
    n: '3',
    title: 'Soumettez votre demande',
    desc: "Ajoutez le produit à votre panier, renseignez vos informations de livraison et confirmez votre commande. On s'occupe du reste !",
  },
]

const FAQS = [
  { q: "Livrez-vous dans toute l'Algérie ?",               a: "Oui, nous livrons dans les 58 wilayas. Le délai est généralement de 2 à 5 jours ouvrables." },
  { q: 'Quel est le mode de paiement accepté ?',           a: 'Paiement à la livraison uniquement (cash). Vous payez quand vous recevez votre commande.' },
  { q: 'Puis-je commander des emballages personnalisés ?', a: 'Oui ! Nos produits peuvent être personnalisés avec votre logo. Contactez-nous via WhatsApp pour votre projet.' },
  { q: "Quelle est la commande minimum ?",                 a: "Aucun minimum pour les produits en stock. Pour le sur-mesure, un minimum peut s'appliquer." },
  { q: 'Comment suivre ma commande ?',                     a: "Notre équipe vous contacte par téléphone après confirmation pour vous informer de la livraison." },
  { q: 'Vos emballages sont-ils résistants ?',             a: 'Absolument. Nos cartons sont testés pour des charges importantes. La qualité est notre priorité.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderColor: 'rgba(176,136,152,0.25)' }}
      className="border rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors duration-200"
        style={{ background: open ? 'rgba(176,136,152,0.06)' : 'transparent' }}>
        <span style={{ color: ROSE }} className="font-bold text-sm pr-4">{q}</span>
        <ChevronRight size={18} style={{ color: ROSE }}
          className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5" style={{ borderTop: `1px solid rgba(176,136,152,0.15)` }}>
          <p style={{ color: ROSE_SOFT }} className="text-sm leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #f9f0f6 0%, #f3ecf8 40%, #ede8f5 100%)' }}>

      {/* ── Hero ── */}
      <header className="px-4 py-6 pt-20">
        <div className="relative overflow-hidden rounded-xl bg-charcoal
                        flex items-center justify-center min-h-[320px] md:min-h-[420px]">
          <div className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(75,32,56,0.45), rgba(34,22,16,0.82)), url('/main.png')`,
            }}
          />
          <div className="absolute top-10 right-10 text-gold/40 animate-pulse text-5xl select-none">✦</div>
          <div className="relative z-10 w-full flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto">
            <span className="uppercase tracking-[0.3em] text-xs font-semibold mb-3"
              style={{ color: ROSE }}>
             
            </span>
            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight mb-5 italic">
              L'emballage qui fait la différence
            </h1>
            <p className="text-white/75 text-sm md:text-base mb-8 leading-relaxed max-w-lg">
              Découvrez notre gamme d'emballages de qualité — cartons, sacs, cartes et papiers —
              livrés partout en Algérie.
            </p>
            {/* Bouton rose mauve doux */}
            <button onClick={() => navigate('/products')}
              className="px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-dark text-white"
              style={{ background: ROSE }}>
              Découvrir la boutique
            </button>
          </div>
        </div>
      </header>

      {/* ── Collections ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center italic" style={{ color: ROSE }}>
          Nos collections
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {CAT_IMAGES.map(({ label, cat, image }) => (
            <Link key={label} to={`/products?category=${cat}`} className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl
                              transition-transform duration-500 group-hover:-translate-y-2"
                style={{ boxShadow: `0 0 20px rgba(176,136,152,0.25)` }}>
                <img src={image} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-end p-6"
                  style={{ background: 'linear-gradient(to top, rgba(176,136,152,0.85), transparent)' }}>
                  <p className="text-white text-xl font-bold italic tracking-wide">{label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Comment commander ── */}
      <section className="py-20 px-4 my-4">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 relative"
          style={{
            borderTop: `8px solid rgba(176,136,152,0.25)`,
            borderBottom: `8px solid rgba(176,136,152,0.25)`,
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(8px)',
          }}>

          {/* Badge deux lignes */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl
                          font-bold text-sm uppercase tracking-widest text-center leading-snug
                          w-max max-w-[300px] text-white shadow-dark"
            style={{ background: ROSE }}>
            <span className="block">Passez votre commande</span>
            <span className="block">en quelques clics</span>
          </div>

          {/* Sous-titre */}
          <p className="text-center font-black italic text-xl mb-10 pt-2"
            style={{ color: ROSE }}>
            Comment commander en 3 étapes simples
          </p>

          <div className="grid md:grid-cols-3 gap-10 text-center relative z-10">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full text-white flex items-center
                                justify-center mb-4 text-2xl font-bold flex-shrink-0 shadow-dark"
                  style={{ background: ROSE }}>
                  {n}
                </div>
                <h3 className="font-bold text-base mb-2 italic" style={{ color: ROSE }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: ROSE_SOFT }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span className="font-bold text-xs uppercase tracking-widest mb-3 block"
            style={{ color: ROSE }}>
            Assistance
          </span>
          <h2 className="text-3xl font-black italic" style={{ color: ROSE }}>
            Questions les plus posées
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

    </div>
  )
}

export default HomePage