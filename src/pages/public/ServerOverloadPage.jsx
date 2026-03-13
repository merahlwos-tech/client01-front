import { useNavigate } from 'react-router-dom'
import { RefreshCw, Wifi } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function ServerOverloadPage() {
  const { t, isRTL } = useLang()
  const navigate = useNavigate()

  const handleRetry = () => {
    navigate(0) // reload
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 50%,#e0e7ff 100%)' }}>
      <div className="text-center max-w-md">

        {/* Icon */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          <Wifi size={48} style={{ color: PURPLE }} className="opacity-50" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/icon.webp" alt="BrandPack" className="w-10 h-10 rounded-full" />
          <span className="font-black italic text-2xl" style={{ color: NAVY }}>BrandPack</span>
        </div>

        <h1 className="font-black text-2xl mb-3" style={{ color: NAVY }}>
          {t('serverOverload')}
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {t('serverOverloadDesc')}
        </p>

        <button onClick={handleRetry}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-black
                     transition-all hover:opacity-90 shadow-lg"
          style={{ background: PURPLE }}>
          <RefreshCw size={18} />
          {t('retry')}
        </button>
      </div>
    </div>
  )
}

export default ServerOverloadPage