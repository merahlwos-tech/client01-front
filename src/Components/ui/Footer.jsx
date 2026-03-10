import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'
const PHONE  = '+213554767444'
const WA     = '213554767444'

function AdminSecretAccess() {
  const [clicks, setClicks]     = useState(0)
  const [showInput, setShowInput] = useState(false)
  const [value, setValue]       = useState('')
  const navigate = useNavigate()

  const handleClick = () => {
    const next = clicks + 1
    setClicks(next)
    if (next >= 3) { setShowInput(true); setClicks(0) }
  }

  const handleChange = e => {
    const val = e.target.value
    setValue(val)
    if (val.toLowerCase() === 'admin') {
      setShowInput(false); setValue(''); navigate('/admin/login')
    }
  }

  return (
    <div className="relative inline-block">
      <span onClick={handleClick} className="cursor-default select-none text-xs"
        style={{ color: 'rgba(255,255,255,0.2)' }}>©</span>
      {showInput && (
        <input autoFocus type="text" value={value} onChange={handleChange}
          onBlur={() => { setShowInput(false); setValue(''); setClicks(0) }}
          className="absolute bottom-6 right-0 w-24 bg-white text-xs px-2 py-1 rounded-lg outline-none shadow-lg"
          style={{ color: NAVY }} placeholder="..." />
      )}
    </div>
  )
}

function Footer() {
  const { t, lang } = useLang()

  const LINKS = [
    { label: t('boxes'), to: '/products?category=Board' },
    { label: t('bags'),  to: '/products?category=Bags' },
    { label: t('cards'), to: '/products?category=Autocollants' },
    { label: t('paper'), to: '/products?category=Paper' },
    { label: t('about'), to: '/about' },
  ]

  return (
    <footer style={{ background: NAVY, borderTop: `1px solid rgba(124,58,237,0.2)` }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpg" alt="BrandPack" className="w-10 h-10 rounded-full object-contain" />
              <div>
                <p className="font-black italic text-white text-xl leading-none">BrandPack</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  for packaging
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-6"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              {lang === 'ar'
                ? 'تغليف احترافي مخصص لعملك — صناديق، أكياس، بطاقات، ورق.'
                : "Emballages personnalisés pour votre business — boites, sacs, cartes, papier."}
            </p>
          </div>

          {/* Liens */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: PURPLE }}>{t('quickLinks')}</p>
            <ul className="space-y-2">
              {LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm transition-colors hover:opacity-100"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + WhatsApp */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: PURPLE }}>{t('contact')}</p>
            <ul className="space-y-2 mb-5">
              <li>
                <a href={`tel:${PHONE}`} className="text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
                  +213 554 76 74 44
                </a>
              </li>
              <li className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Alger — {t('delivery69')}
              </li>
            </ul>
            <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ background: '#25D366' }}>
              <MessageCircle size={16} />
              {t('whatsappBtn')}
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid rgba(124,58,237,0.15)' }}>
          <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <AdminSecretAccess />
            {' '}{new Date().getFullYear()} BrandPack for packaging
          </p>
          <a href="https://www.instagram.com/cvkdev/" target="_blank" rel="noreferrer"
            className="text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.2)'}>
            Developed by CvkDev
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer