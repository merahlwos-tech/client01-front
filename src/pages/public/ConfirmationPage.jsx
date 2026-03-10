import { Link } from 'react-router-dom'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function ConfirmationPage() {
  const { t, isRTL } = useLang()

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20"
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}
      dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg w-full text-center">

        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          🎉
        </div>

        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
          {t('confirmed')}
        </p>
        <h1 className="font-black italic text-5xl mb-4" style={{ color: NAVY }}>
          {t('thanks')}
        </h1>
        <p className="text-gray-500 leading-relaxed mb-2">{t('orderRegistered')}</p>
        <p className="text-gray-500 leading-relaxed mb-10">{t('teamContact')}</p>

        <div className="rounded-2xl p-5 mb-8 flex items-start gap-4 text-left"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <span className="text-2xl">🚚</span>
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: NAVY }}>{t('deliveryEstimate')}</p>
            <p className="text-gray-500 text-sm">{t('deliveryDays')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/products"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl
                       text-white font-black transition-all hover:opacity-90 shadow-lg"
            style={{ background: PURPLE }}>
            🛍️ {t('continueShopping')}
          </Link>
          <Link to="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl
                       border-2 font-black transition-all hover:bg-purple-50"
            style={{ borderColor: PURPLE, color: PURPLE }}>
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPage