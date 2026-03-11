import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const NAVY         = '#1e1b4b'
const PURPLE       = '#7c3aed'
const PURPLE_SOFT  = 'rgba(124,58,237,0.65)'
const PURPLE_XSOFT = 'rgba(124,58,237,0.35)'

const CAT_IMAGES = [
  { label_fr: 'Boites',  label_ar: 'صناديق', cat: 'Board',        image: '/boite.png' },
  { label_fr: 'Sacs',    label_ar: 'أكياس',  cat: 'Bags',         image: '/sacs.png' },
  { label_fr: 'Cartes',  label_ar: 'بطاقات', cat: 'Autocollants', image: '/carte.png' },
  { label_fr: 'Papier',  label_ar: 'ورق',    cat: 'Paper',        image: '/papier.png' },
]

const STEPS_FR = [
  { n: '1', title: 'Choisissez votre produit',   desc: "Parcourez nos catégories et choisissez le produit qui correspond à vos besoins, puis précisez la taille et la quantité." },
  { n: '2', title: 'Personnalisez votre design', desc: "Téléchargez votre propre fichier de conception et choisissez le nombre de couleurs ainsi que les autres options d'impression." },
  { n: '3', title: 'Soumettez votre demande',    desc: "Ajoutez le produit à votre panier, renseignez vos informations de livraison et confirmez votre commande. On s'occupe du reste !" },
]
const STEPS_AR = [
  { n: '1', title: 'اختر منتجك',   desc: 'تصفّح فئاتنا واختر المنتج الذي يناسب احتياجاتك، ثم حدّد الحجم والكمية.' },
  { n: '2', title: 'خصّص تصميمك', desc: 'ارفع ملف تصميمك الخاص واختر عدد الألوان وخيارات الطباعة الأخرى.' },
  { n: '3', title: 'قدّم طلبك',   desc: 'أضف المنتج إلى سلتك، أدخل معلومات التوصيل وأكّد طلبك. نحن نتكفل بالباقي!' },
]

const FAQS_FR = [
  { q: "Livrez-vous dans toute l'Algérie ?",               a: "Oui, nous livrons dans les 69 wilayas. Le délai est généralement de 2 à 5 jours ouvrables." },
  { q: 'Quel est le mode de paiement accepté ?',           a: 'Paiement à la livraison uniquement (cash). Vous payez quand vous recevez votre commande.' },
  { q: 'Puis-je commander des emballages personnalisés ?', a: 'Oui ! Nos produits peuvent être personnalisés avec votre logo. Contactez-nous via WhatsApp.' },
  { q: "Quelle est la commande minimum ?",                 a: "Aucun minimum pour les produits en stock. Pour le sur-mesure, un minimum peut s'appliquer." },
  { q: 'Comment suivre ma commande ?',                     a: "Notre équipe vous contacte par téléphone après confirmation pour vous informer de la livraison." },
  { q: 'Vos emballages sont-ils résistants ?',             a: 'Absolument. Nos cartons sont testés pour des charges importantes. La qualité est notre priorité.' },
]
const FAQS_AR = [
  { q: 'هل تُوصّلون لكل الجزائر؟',         a: 'نعم، نوصّل لـ 69 ولاية. المدة عادةً من 2 إلى 5 أيام عمل.' },
  { q: 'ما طريقة الدفع المقبولة؟',          a: 'الدفع عند الاستلام فقط (نقداً). تدفع حين تستلم طلبك.' },
  { q: 'هل يمكنني طلب تغليف مخصص بشعاري؟', a: 'نعم! يمكن تخصيص منتجاتنا بشعارك. تواصل معنا عبر واتساب.' },
  { q: 'ما هو الحد الأدنى للطلب؟',          a: 'لا يوجد حد أدنى للمنتجات الجاهزة. للطلبات الخاصة قد يُطبّق حد أدنى.' },
  { q: 'كيف أتابع طلبي؟',                   a: 'يتصل بك فريقنا هاتفياً بعد التأكيد لإعلامك بموعد التسليم.' },
  { q: 'هل تغليفكم متين؟',                  a: 'بالتأكيد. كراتيننا مُختبَرة لتحمّل أحمال كبيرة. الجودة أولويتنا.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm"
      style={{ border: `1px solid ${PURPLE_XSOFT}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors duration-200"
        style={{ background: open ? 'rgba(124,58,237,0.05)' : 'transparent' }}>
        <span className="font-bold text-sm pr-4" style={{ color: NAVY }}>{q}</span>
        <ChevronRight size={18} style={{ color: PURPLE }}
          className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5" style={{ borderTop: `1px solid ${PURPLE_XSOFT}` }}>
          <p className="text-sm leading-relaxed pt-4" style={{ color: PURPLE_SOFT }}>{a}</p>
        </div>
      )}
    </div>
  )
}

function HomePage() {
  const { lang, isRTL } = useLang()
  const produitsSectionRef = useRef(null)

  const steps   = lang === 'ar' ? STEPS_AR : STEPS_FR
  const faqs    = lang === 'ar' ? FAQS_AR  : FAQS_FR
  const fontCls = lang === 'ar' ? 'font-arabic' : ''

  /* ── Scroll smooth vers la section Nos Produits ── */
  const scrollToProduits = () => {
    produitsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`min-h-screen ${fontCls}`} dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <header className="px-4 pt-20 pb-6">

        {/* Desktop — 2 colonnes */}
        <div className="hidden md:flex items-stretch gap-0 rounded-2xl overflow-hidden max-w-7xl mx-auto"
          style={{ minHeight: 440, background: 'white', boxShadow: '0 8px 40px rgba(124,58,237,0.13)' }}>

          {/* Texte */}
          <div className={`flex-1 px-10 lg:px-16 py-12 flex flex-col justify-center
                          ${isRTL ? 'items-end text-right' : 'items-start text-left'}`}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest
                             px-3 py-1 rounded-full mb-6"
              style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
              <Package size={12} />
              {lang === 'ar' ? 'تغليف مخصص · توصيل لكل الجزائر' : 'Emballage sur mesure · Livraison Algérie'}
            </span>

            <h1 className="font-black leading-tight mb-5"
              style={{ color: NAVY, fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
              {lang === 'ar'
                ? <>التغليف الذي<br /><span style={{ color: PURPLE }}>يصنع الفرق</span></>
                : <>L'emballage qui<br /><span style={{ color: PURPLE }}>fait la différence</span></>}
            </h1>

            <p className="text-sm leading-relaxed mb-8 max-w-sm"
              style={{ color: 'rgba(30,27,75,0.6)' }}>
              {lang === 'ar'
                ? 'كراتين، أكياس، بطاقات وورق مطبوع بشعارك — جودة عالية، دفع عند الاستلام.'
                : 'Cartons, sacs, cartes et papier imprimés à votre image — qualité premium, paiement à la livraison.'}
            </p>

            <div className={`flex gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* ← scroll vers la section, pas navigate */}
              <button
                onClick={scrollToProduits}
                className="px-7 py-3 rounded-full font-bold text-white text-sm shadow-lg
                           transition-all hover:scale-105 hover:opacity-90"
                style={{ background: PURPLE }}>
                {lang === 'ar' ? 'اكتشف منتجاتنا' : 'Découvrir nos produits'}
              </button>
              <a href="https://wa.me/213554767444" target="_blank" rel="noreferrer"
                className="px-7 py-3 rounded-full font-bold text-sm border-2 transition-all hover:scale-105"
                style={{ borderColor: PURPLE, color: PURPLE, background: 'transparent' }}>
                WhatsApp
              </a>
            </div>

            {/* Stats */}
            <div className={`flex gap-8 mt-10 pt-8 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ borderTop: '1px solid rgba(124,58,237,0.12)' }}>
              {[
                { val: '500+', label: lang === 'ar' ? 'عميل راضٍ'     : 'Clients satisfaits' },
                { val: '69',   label: lang === 'ar' ? 'ولاية'          : 'Wilayas' },
                { val: '100%', label: lang === 'ar' ? 'دفع عند الاستلام' : 'Paiement livraison' },
              ].map(s => (
                <div key={s.val} className={isRTL ? 'text-right' : ''}>
                  <p className="text-2xl font-black" style={{ color: PURPLE }}>{s.val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Photo — pleine hauteur */}
          <div className="w-[42%] lg:w-[45%] self-stretch flex-shrink-0">
            <img src="/main.jpg" alt="BrandPack emballages"
              className="w-full h-full object-cover" style={{ minHeight: 440 }} />
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden relative overflow-hidden rounded-2xl flex items-center justify-center min-h-[300px]"
          style={{ background: NAVY }}>
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(30,27,75,0.45), rgba(30,27,75,0.82)), url('/main.jpg')` }} />
          <div className="relative z-10 w-full flex flex-col items-center text-center px-6 py-14 max-w-2xl mx-auto">
            <h1 className="text-white text-3xl font-black leading-tight mb-4 italic">
              {lang === 'ar' ? 'التغليف الذي يصنع الفرق' : "L'emballage qui fait la différence"}
            </h1>
            <p className="text-white/75 text-sm mb-7 leading-relaxed max-w-xs">
              {lang === 'ar'
                ? 'كراتين، أكياس، بطاقات وورق — توصيل لكل الجزائر.'
                : 'Cartons, sacs, cartes et papier — livrés partout en Algérie.'}
            </p>
            {/* ← scroll vers la section, pas navigate */}
            <button onClick={scrollToProduits}
              className="px-8 py-3 rounded-full font-bold text-white text-sm shadow-lg transition-all hover:scale-105"
              style={{ background: PURPLE }}>
              {lang === 'ar' ? 'اكتشف منتجاتنا' : 'Découvrir nos produits'}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          NOS PRODUITS  ← ancre de scroll
      ══════════════════════════════════════ */}
      <section
        ref={produitsSectionRef}
        id="nos-produits"
        className="max-w-7xl mx-auto px-4 py-14 scroll-mt-20">

        {/* Titre section */}
        <div className={`flex items-center gap-4 mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
          <h2 className="text-2xl md:text-3xl font-black italic whitespace-nowrap" style={{ color: PURPLE }}>
            {lang === 'ar' ? 'منتجاتنا' : 'Nos produits'}
          </h2>
          <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
        </div>

        {/* Grille catégories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {CAT_IMAGES.map(({ label_fr, label_ar, cat, image }) => {
            const label = lang === 'ar' ? label_ar : label_fr
            return (
              <Link key={cat} to={`/products?category=${cat}`} className="group cursor-pointer block">
                <div className="flex flex-col items-center">

                  {/* Photo */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl transition-all duration-500
                                  group-hover:-translate-y-2 group-hover:shadow-2xl"
                    style={{ boxShadow: '0 4px 24px rgba(124,58,237,0.1)' }}>

                    <img src={image} alt={label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                    {/* Léger vignettage bas pour profondeur */}
                    <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, rgba(15,10,40,0.25), transparent)' }} />

                    {/* Hover overlay subtil */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'rgba(124,58,237,0.08)' }} />
                  </div>

                  {/* ── Label EN DEHORS — badge violet style "Passez votre commande" ── */}
                  <div className="relative -mt-4 z-10">
                    <span
                      className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold
                                 text-white shadow-lg uppercase tracking-wide leading-none
                                 transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: PURPLE,
                        boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                      }}>
                      {label}
                    </span>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMMENT COMMANDER
      ══════════════════════════════════════ */}
      <section className="py-20 px-4 my-4">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 relative"
          style={{
            borderTop: `8px solid ${PURPLE_XSOFT}`,
            borderBottom: `8px solid ${PURPLE_XSOFT}`,
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(8px)',
          }}>
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl
                          font-bold text-sm uppercase tracking-widest text-center leading-snug
                          w-max max-w-[300px] text-white shadow-lg"
            style={{ background: PURPLE }}>
            {lang === 'ar'
              ? <><span className="block">اطلب الآن</span><span className="block">بخطوات بسيطة</span></>
              : <><span className="block">Passez votre commande</span><span className="block">en quelques clics</span></>}
          </div>
          <p className="text-center font-black italic text-xl mb-10 pt-2" style={{ color: NAVY }}>
            {lang === 'ar' ? 'كيف تطلب في 3 خطوات بسيطة' : 'Comment commander en 3 étapes simples'}
          </p>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full text-white flex items-center justify-center
                                mb-4 text-2xl font-bold flex-shrink-0 shadow-lg"
                  style={{ background: PURPLE }}>
                  {n}
                </div>
                <h3 className="font-bold text-base mb-2 italic" style={{ color: NAVY }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: PURPLE_SOFT }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span className="font-bold text-xs uppercase tracking-widest mb-3 block" style={{ color: PURPLE }}>
            {lang === 'ar' ? 'مساعدة' : 'Assistance'}
          </span>
          <h2 className="text-3xl font-black italic" style={{ color: PURPLE }}>
            {lang === 'ar' ? 'الأسئلة الأكثر طرحاً' : 'Questions les plus posées'}
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

    </div>
  )
}

export default HomePage