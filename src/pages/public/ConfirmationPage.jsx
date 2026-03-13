import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useLang } from '../../context/LanguageContext'
import { useSEO } from '../../utils/UseSEO'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function ConfirmationPage() {
  const { t, isRTL, lang } = useLang()
  useSEO({ title: 'Commande confirmée' })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="min-h-screen flex items-start justify-center px-4 sm:px-6 pt-24 pb-16"
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}
      dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg w-full text-center">

        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl sm:text-5xl"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          🎉
        </div>

        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
          {t('confirmed')}
        </p>
        <h1 className={`font-black italic mb-4 ${lang === 'ar' ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'}`}
          style={{ color: NAVY }}>
          {t('thanks')}
        </h1>
        <p className={`text-gray-500 leading-relaxed mb-2 ${lang === 'ar' ? 'text-base font-arabic' : ''}`}>
          {t('orderRegistered')}
        </p>
        <p className={`text-gray-500 leading-relaxed mb-8 ${lang === 'ar' ? 'text-base font-arabic' : ''}`}>
          {t('teamContact')}
        </p>

        <div className="rounded-2xl p-4 sm:p-5 mb-8"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <span className="text-2xl flex-shrink-0">🚚</span>
            <div>
              <p className={`font-bold text-sm mb-1 ${lang === 'ar' ? 'font-arabic' : ''}`} style={{ color: NAVY }}>
                {t('deliveryEstimate')}
              </p>
              <p className={`text-gray-500 text-sm ${lang === 'ar' ? 'font-arabic' : ''}`}>
                {t('deliveryDays')}
              </p>
            </div>
          </div>
        </div>

        <div className={`flex gap-3 justify-center ${isRTL ? 'flex-col sm:flex-row-reverse' : 'flex-col sm:flex-row'}`}>
          <Link to="/products"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-2xl
                       text-white font-black transition-all hover:opacity-90 shadow-lg"
            style={{ background: PURPLE }}>
            🛍️ {t('continueShopping')}
          </Link>
          <Link to="/"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-2xl
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