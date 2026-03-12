import { Link } from 'react-router-dom'
import { Package, Truck, Shield, Star, MapPin, Phone } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'
import { useSEO } from '../../utils/useSEO'

const NAVY         = '#1e1b4b'
const PURPLE       = '#7c3aed'
const PURPLE_SOFT  = 'rgba(124,58,237,0.65)'
const PURPLE_XSOFT = 'rgba(124,58,237,0.35)'

const CONTENT = {
  fr: {
    hero_badge:  'Emballage sur mesure · Algérie',
    hero_title:  'Qui sommes-nous ?',
    hero_sub:    "BrandPack, votre partenaire d\u2019emballage en Alg\u00e9rie \u2014 cartons, sacs, autocollants et papier.",
    mission_tag: 'Notre mission',
    mission_h2:  "L\u2019emballage au service de votre image",
    mission_p:   "Chez BrandPack, nous croyons que l'emballage est le premier contact de votre client avec votre marque. C'est pourquoi nous proposons des solutions d'emballage de qualité — cartons solides, sacs élégants, autocollants personnalisés et papiers créatifs — pour les professionnels et particuliers partout en Algérie.",
    mission_quote: "L\u2019emballage, c\u2019est notre art",
    products_tag: 'Ce que nous vendons',
    products_h2:  'Nos catégories',
    products: [
      { emoji: '📦', label: 'Cartons',      desc: "Cartons d'emballage solides, toutes tailles" },
      { emoji: '🛍️', label: 'Sacs',         desc: 'Sacs kraft, plastique, luxe et personnalisés' },
      { emoji: '🏷️', label: 'Autocollants', desc: 'Stickers sur-mesure pour votre marque' },
      { emoji: '📄', label: 'Papier',        desc: "Papier kraft, calque, cadeau et d'impression" },
    ],
    values_tag: 'Nos valeurs',
    values_h2:  'Ce qui nous définit',
    values: [
      { icon: Package, title: 'Qualité',    desc: 'Des matériaux solides et durables pour protéger vos produits.' },
      { icon: Shield,  title: 'Fiabilité',  desc: 'Commandes traitées avec soin, emballages conformes à votre demande.' },
      { icon: Truck,   title: 'Livraison',  desc: "Livraison dans les 69 wilayas d'Algérie, rapidement." },
      { icon: Star,    title: 'Sur-mesure', desc: 'Personnalisation disponible : logo, couleur, taille selon vos besoins.' },
    ],
    contact_tag: 'Contactez-nous',
    contact_h2:  'Nous sommes en Algérie',
    contact_loc: 'Livraison dans les 69 wilayas',
    contact_pay: 'Paiement à la livraison',
    cta:         'Découvrir la boutique',
  },
  ar: {
    hero_badge:  'تغليف مخصص · الجزائر',
    hero_title:  'من نحن؟',
    hero_sub:    'براندباك، شريككم في التغليف بالجزائر — كراتين، أكياس، ملصقات وورق.',
    mission_tag: 'مهمتنا',
    mission_h2:  'التغليف في خدمة صورتك',
    mission_p:   'في براندباك، نؤمن بأن التغليف هو أول تواصل بين عميلك وعلامتك التجارية. لذلك نقدم حلول تغليف عالية الجودة — كراتين متينة، أكياس أنيقة، ملصقات مخصصة وأوراق إبداعية — للمهنيين والأفراد في كل أنحاء الجزائر.',
    mission_quote: 'التغليف هو فنّنا',
    products_tag: 'ما نبيعه',
    products_h2:  'فئاتنا',
    products: [
      { emoji: '📦', label: 'كراتين',  desc: 'كراتين تغليف متينة بجميع المقاسات' },
      { emoji: '🛍️', label: 'أكياس',   desc: 'أكياس كرافت، بلاستيك، فاخرة ومخصصة' },
      { emoji: '🏷️', label: 'ملصقات', desc: 'ستيكرات مخصصة لعلامتك التجارية' },
      { emoji: '📄', label: 'ورق',      desc: 'ورق كرافت، شفاف، هدايا وطباعة' },
    ],
    values_tag: 'قيمنا',
    values_h2:  'ما يميّزنا',
    values: [
      { icon: Package, title: 'الجودة',    desc: 'مواد متينة وصلبة لحماية منتجاتك.' },
      { icon: Shield,  title: 'الموثوقية', desc: 'طلبات تُعالج بعناية، تغليف مطابق لطلبك.' },
      { icon: Truck,   title: 'التوصيل',   desc: 'توصيل إلى 69 ولاية جزائرية بسرعة.' },
      { icon: Star,    title: 'حسب الطلب', desc: 'تخصيص متاح: شعار، لون، مقاس حسب احتياجاتك.' },
    ],
    contact_tag: 'تواصل معنا',
    contact_h2:  'نحن في الجزائر',
    contact_loc: 'توصيل إلى 69 ولاية',
    contact_pay: 'الدفع عند الاستلام',
    cta:         'اكتشف المتجر',
  },
}

function AboutPage() {
  const { lang, isRTL } = useLang()
  const t       = CONTENT[lang] ?? CONTENT.fr
  const fontCls = lang === 'ar' ? 'font-arabic' : ''

  useSEO({
    title: 'À propos de BrandPack',
    description: 'BrandPack — votre partenaire en emballages personnalisés en Algérie. Boites, sacs, cartes, papier. Livraison dans les 58 wilayas.',
  })
  return (
    <div className={`min-h-screen ${fontCls}`} dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>

      {/* HERO — sans photo, dégradé pur */}
      <header className="px-4 pt-20 pb-6">
        <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 60%, #4c1d95 100%)',
            boxShadow: '0 8px 40px rgba(124,58,237,0.25)',
            minHeight: 320,
          }}>
          <div className="relative flex flex-col items-center justify-center text-center px-8 py-20 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
              style={{ background: PURPLE }} />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10"
              style={{ background: '#818cf8' }} />

            <span className="relative z-10 inline-flex items-center gap-2 text-xs font-bold uppercase
                             tracking-widest px-3 py-1 rounded-full mb-6"
              style={{ background: 'rgba(124,58,237,0.35)', color: '#c4b5fd' }}>
              <Package size={12} />
              {t.hero_badge}
            </span>

            <h1 className="relative z-10 font-black leading-tight mb-5 text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              {t.hero_title}
            </h1>

            <p className="relative z-10 text-sm leading-relaxed max-w-lg"
              style={{ color: 'rgba(255,255,255,0.65)' }}>
              {t.hero_sub}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">

        {/* NOTRE MISSION */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center`}>
          <div className={isRTL ? 'text-right order-2' : ''}>
            <span className="font-bold text-xs uppercase tracking-widest mb-3 block" style={{ color: PURPLE }}>
              {t.mission_tag}
            </span>
            <h2 className="text-3xl font-black italic mb-5 leading-snug" style={{ color: NAVY }}>
              {t.mission_h2}
            </h2>
            <p className="leading-relaxed text-sm" style={{ color: PURPLE_SOFT }}>
              {t.mission_p}
            </p>
          </div>

          <div className={`rounded-3xl p-8 text-center relative overflow-hidden ${isRTL ? 'order-1' : ''}`}
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${PURPLE_XSOFT}`,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 24px rgba(124,58,237,0.1)',
            }}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl
                            font-bold text-sm text-white shadow-lg w-max"
              style={{ background: PURPLE }}>
              📦 BrandPack
            </div>
            <p className="text-5xl mb-4 mt-4">📦</p>
            <p className="text-xl font-black italic" style={{ color: NAVY }}>
              {t.mission_quote}
            </p>
          </div>
        </div>

        {/* NOS CATÉGORIES */}
        <div>
          <div className={`flex items-center gap-4 mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <div className="text-center">
              <span className="font-bold text-xs uppercase tracking-widest block mb-1" style={{ color: PURPLE }}>
                {t.products_tag}
              </span>
              <h2 className="text-2xl md:text-3xl font-black italic whitespace-nowrap" style={{ color: PURPLE }}>
                {t.products_h2}
              </h2>
            </div>
            <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.products.map(({ emoji, label, desc }) => (
              <div key={label}
                className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: `1px solid ${PURPLE_XSOFT}`,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.08)',
                }}>
                <span className="text-5xl block mb-4">{emoji}</span>
                <p className="font-black italic text-base mb-2" style={{ color: NAVY }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: PURPLE_SOFT }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* NOS VALEURS */}
        <div>
          <div className={`flex items-center gap-4 mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <div className="text-center">
              <span className="font-bold text-xs uppercase tracking-widest block mb-1" style={{ color: PURPLE }}>
                {t.values_tag}
              </span>
              <h2 className="text-2xl md:text-3xl font-black italic whitespace-nowrap" style={{ color: PURPLE }}>
                {t.values_h2}
              </h2>
            </div>
            <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {t.values.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className={`rounded-2xl p-6 flex gap-4 transition-all duration-300 hover:-translate-y-1 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: `1px solid ${PURPLE_XSOFT}`,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.08)',
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ background: PURPLE }}>
                  <Icon size={20} color="white" />
                </div>
                <div>
                  <h3 className="font-black italic text-lg mb-1" style={{ color: NAVY }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: PURPLE_SOFT }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT CTA — style "Passez votre commande" */}
        <div className="relative rounded-3xl p-8 md:p-12 text-center"
          style={{
            borderTop: `8px solid ${PURPLE_XSOFT}`,
            borderBottom: `8px solid ${PURPLE_XSOFT}`,
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(8px)',
          }}>

          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl
                          font-bold text-sm text-white shadow-lg w-max"
            style={{ background: PURPLE }}>
            {t.contact_tag}
          </div>

          <h2 className="text-3xl font-black italic mb-6 pt-2" style={{ color: NAVY }}>
            {t.contact_h2}
          </h2>

          <div className={`flex flex-col sm:flex-row gap-6 justify-center mb-8 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-3 text-sm justify-center" style={{ color: PURPLE_SOFT }}>
              <MapPin size={16} style={{ color: PURPLE }} />
              <span>{t.contact_loc}</span>
            </div>
            <div className="flex items-center gap-3 text-sm justify-center" style={{ color: PURPLE_SOFT }}>
              <Phone size={16} style={{ color: PURPLE }} />
              <span>{t.contact_pay}</span>
            </div>
          </div>

          <Link to="/products"
            className="inline-block px-8 py-3 rounded-full font-bold text-white text-sm shadow-lg
                       transition-all hover:scale-105 hover:opacity-90"
            style={{ background: PURPLE }}>
            {t.cta}
          </Link>
        </div>

      </div>

      <div className="h-24" />
    </div>
  )
}

export default AboutPage