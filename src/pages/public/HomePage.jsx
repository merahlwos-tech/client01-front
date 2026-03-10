import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const NAVY        = '#1e1b4b'
const PURPLE      = '#7c3aed'
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
  { n: '1', title: 'اختر منتجك',            desc: 'تصفّح فئاتنا واختر المنتج الذي يناسب احتياجاتك، ثم حدّد الحجم والكمية.' },
  { n: '2', title: 'خصّص تصميمك',           desc: 'ارفع ملف تصميمك الخاص واختر عدد الألوان وخيارات الطباعة الأخرى.' },
  { n: '3', title: 'قدّم طلبك',             desc: 'أضف المنتج إلى سلتك، أدخل معلومات التوصيل وأكّد طلبك. نحن نتكفل بالباقي!' },
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
  { q: 'هل تُوصّلون لكل الجزائر؟',           a: 'نعم، نوصّل لـ 69 ولاية. المدة عادةً من 2 إلى 5 أيام عمل.' },
  { q: 'ما طريقة الدفع المقبولة؟',            a: 'الدفع عند الاستلام فقط (نقداً). تدفع حين تستلم طلبك.' },
  { q: 'هل يمكنني طلب تغليف مخصص بشعاري؟',   a: 'نعم! يمكن تخصيص منتجاتنا بشعارك. تواصل معنا عبر واتساب.' },
  { q: 'ما هو الحد الأدنى للطلب؟',            a: 'لا يوجد حد أدنى للمنتجات الجاهزة. للطلبات الخاصة قد يُطبّق حد أدنى.' },
  { q: 'كيف أتابع طلبي؟',                     a: 'يتصل بك فريقنا هاتفياً بعد التأكيد لإعلامك بموعد التسليم.' },
  { q: 'هل تغليفكم متين؟',                    a: 'بالتأكيد. كراتيننا مُختبَرة لتحمّل أحمال كبيرة. الجودة أولويتنا.' },
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
  const navigate = useNavigate()
  const { lang, isRTL } = useLang()

  const steps = lang === 'ar' ? STEPS_AR : STEPS_FR
  const faqs  = lang === 'ar' ? FAQS_AR  : FAQS_FR

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>

      {/* ── Hero ── */}
      <header className="px-4 py-6 pt-20">
        <div className="relative overflow-hidden rounded-xl flex items-center justify-center min-h-[320px] md:min-h-[420px]"
          style={{ background: NAVY }}>
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(30,27,75,0.5), rgba(30,27,75,0.88)), url('/main.jpg')` }}
          />
          <div className="absolute top-10 right-10 opacity-30 animate-pulse text-5xl select-none" style={{ color: PURPLE }}>✦</div>
          <div className="relative z-10 w-full flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto">
            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight mb-5 italic">
              {lang === 'ar' ? 'التغليف الذي يصنع الفرق' : "L'emballage qui fait la différence"}
            </h1>
            <p className="text-white/75 text-sm md:text-base mb-8 leading-relaxed max-w-lg">
              {lang === 'ar'
                ? 'اكتشف مجموعتنا من التغليف عالي الجودة — كراتين، أكياس، بطاقات وأوراق — توصيل لكل الجزائر.'
                : "Découvrez notre gamme d'emballages de qualité — cartons, sacs, cartes et papiers — livrés partout en Algérie."}
            </p>
            <button onClick={() => navigate('/products')}
              className="px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 text-white shadow-lg"
              style={{ background: PURPLE }}>
              {lang === 'ar' ? 'اكتشف المتجر' : 'Découvrir la boutique'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Collections ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center italic" style={{ color: PURPLE }}>
          {lang === 'ar' ? 'مجموعاتنا' : 'Nos collections'}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {CAT_IMAGES.map(({ label_fr, label_ar, cat, image }) => (
            <Link key={cat} to={`/products?category=${cat}`} className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl transition-transform duration-500 group-hover:-translate-y-2"
                style={{ boxShadow: `0 4px 20px rgba(124,58,237,0.2)` }}>
                <img src={image} alt={lang === 'ar' ? label_ar : label_fr} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-end p-6"
                  style={{ background: `linear-gradient(to top, rgba(30,27,75,0.85), transparent)` }}>
                  <p className="text-white text-xl font-bold italic tracking-wide">
                    {lang === 'ar' ? label_ar : label_fr}
                  </p>
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
                <div className="w-16 h-16 rounded-full text-white flex items-center
                                justify-center mb-4 text-2xl font-bold flex-shrink-0 shadow-lg"
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

      {/* ── FAQ ── */}
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
          {faqs.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

    </div>
  )
}

export default HomePage