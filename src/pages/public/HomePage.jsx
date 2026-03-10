import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Package, Upload, Truck } from 'lucide-react'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const WA     = '213554767444'

const CATEGORIES_FR = [
  { value: 'Board',        label: 'Boites',  emoji: '📦', desc: 'Boites personnalisées' },
  { value: 'Bags',         label: 'Sacs',    emoji: '🛍️', desc: 'Sacs d\'emballage' },
  { value: 'Autocollants', label: 'Cartes',  emoji: '🎴', desc: 'Cartes & stickers' },
  { value: 'Paper',        label: 'Papier',  emoji: '📄', desc: 'Papier d\'impression' },
]
const CATEGORIES_AR = [
  { value: 'Board',        label: 'صناديق', emoji: '📦', desc: 'صناديق مخصصة' },
  { value: 'Bags',         label: 'أكياس',  emoji: '🛍️', desc: 'أكياس تغليف' },
  { value: 'Autocollants', label: 'بطاقات', emoji: '🎴', desc: 'بطاقات وملصقات' },
  { value: 'Paper',        label: 'ورق',    emoji: '📄', desc: 'ورق طباعة' },
]

function HomePage() {
  const { t, lang, isRTL } = useLang()
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts((res.data || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = lang === 'ar' ? CATEGORIES_AR : CATEGORIES_FR

  const STEPS = [
    { icon: Package, title: t('how1title'), desc: t('how1desc'), num: '01' },
    { icon: Upload,  title: t('how2title'), desc: t('how2desc'), num: '02' },
    { icon: Truck,   title: t('how3title'), desc: t('how3desc'), num: '03' },
  ]

  const REVIEWS = [
    { name: t('r1name'), text: t('r1text'), stars: 5 },
    { name: t('r2name'), text: t('r2text'), stars: 5 },
    { name: t('r3name'), text: t('r3text'), stars: 5 },
  ]

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/main.png" alt="BrandPack" className="w-full h-full object-cover" />
          <div className="absolute inset-0"
            style={{ background: isRTL
              ? 'linear-gradient(to left, rgba(30,27,75,0.92) 0%, rgba(30,27,75,0.7) 50%, transparent 100%)'
              : 'linear-gradient(to right, rgba(30,27,75,0.92) 0%, rgba(30,27,75,0.7) 50%, transparent 100%)'
            }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-24 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
              <span>✨</span>
              <span className="text-sm font-bold text-white">{t('heroBadge')}</span>
            </div>

            {/* Titre */}
            <h1 className="font-black italic text-white leading-tight mb-6"
              style={{ fontSize: 'clamp(2.2rem,5.5vw,4.5rem)' }}>
              {t('heroTitle')}
            </h1>

            <p className="text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.75)' }}>
              {t('heroSubtitle')}
            </p>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl
                           text-white font-black text-base transition-all hover:opacity-90 shadow-xl"
                style={{ background: PURPLE }}>
                {t('heroBtn1')}
                <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
              </Link>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl
                           font-black text-base transition-all border-2 hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
                {t('heroBtn2')}
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { val: t('stat1val'), label: t('stat1label') },
                { val: t('stat2val'), label: t('stat2label') },
                { val: t('stat3val'), label: t('stat3label') },
              ].map(({ val, label }) => (
                <div key={label}>
                  <p className="font-black text-white text-2xl">{val}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Catégories ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-black uppercase tracking-widest mb-2"
            style={{ color: PURPLE }}>{t('catSection')}</p>
          <h2 className="font-black italic text-4xl md:text-5xl" style={{ color: NAVY }}>
            {t('catSubtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(({ value, label, emoji, desc }, i) => (
            <Link key={value} to={`/products?category=${value}`}
              className="group bg-white rounded-2xl p-6 text-center border-2 border-transparent
                         transition-all duration-300 hover:-translate-y-1"
              style={{ boxShadow: '0 2px 16px rgba(124,58,237,0.07)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = PURPLE}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <span className="text-5xl block mb-4">{emoji}</span>
              <p className="font-black text-lg mb-1" style={{ color: NAVY }}>{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="py-20" style={{ background: NAVY }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest mb-2"
              style={{ color: PURPLE }}>{t('howSubtitle')}</p>
            <h2 className="font-black italic text-4xl md:text-5xl text-white">
              {t('howTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, desc, num }) => (
              <div key={num} className="relative rounded-2xl p-8"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <p className="font-black text-5xl mb-4 opacity-20 text-white">{num}</p>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(124,58,237,0.25)' }}>
                  <Icon size={22} style={{ color: PURPLE }} />
                </div>
                <h3 className="font-black text-white text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nouveaux produits ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: PURPLE }}>
              {t('newProducts')}
            </p>
            <h2 className="font-black italic text-4xl md:text-5xl" style={{ color: NAVY }}>
              {t('newProductsSubtitle')}
            </h2>
          </div>
          <Link to="/products"
            className="hidden sm:flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: PURPLE }}>
            {t('seeAll')}
            <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
        <ProductGrid products={products} loading={loading} />
      </section>

      {/* ── Avis ── */}
      <section className="py-20"
        style={{ background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(124,58,237,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: PURPLE }}>
              {t('reviewTitle')}
            </p>
            <h2 className="font-black italic text-4xl md:text-5xl" style={{ color: NAVY }}>
              {t('reviewSubtitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(({ name, text, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 italic text-gray-500">"{text}"</p>
                <p className="font-black text-sm" style={{ color: NAVY }}>— {name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20" style={{ background: PURPLE }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-black italic text-white text-4xl md:text-5xl mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="mb-8 text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('ctaSubtitle')}
          </p>
          <Link to="/products"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl
                       font-black text-base transition-all hover:opacity-90 shadow-xl"
            style={{ background: 'white', color: PURPLE }}>
            {t('ctaBtn')}
            <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage