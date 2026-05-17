import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LanguageContext'

const PURPLE       = '#7c3aed'
const PURPLE_XSOFT = 'rgba(124,58,237,0.25)'
const GAP          = 16
const AUTOPLAY_MS  = 1000

function useVisibleCount() {
  const [count, setCount] = useState(3)
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640)       setCount(1)
      else if (window.innerWidth < 1024) setCount(2)
      else                               setCount(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return count
}

export default function ReviewCarousel({ reviews = [], title }) {
  const { lang, isRTL } = useLang()
  const visibleCount    = useVisibleCount()
  const total           = reviews.length
  const maxIndex        = Math.max(0, total - visibleCount)

  const indexRef  = useRef(0)   // ref pour accès dans setInterval sans re-créer
  const scrollRef = useRef(null)
  const timerRef  = useRef(null)

  const getStep = useCallback(() => {
    const el = scrollRef.current
    if (!el) return 0
    return (el.offsetWidth - GAP * (visibleCount - 1)) / visibleCount + GAP
  }, [visibleCount])

  const scrollToIndex = useCallback((idx) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * getStep(), behavior: 'smooth' })
    indexRef.current = idx
  }, [getStep])

  /* Autoplay — tourne en boucle, repart de 0 quand max atteint */
  const startAutoplay = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const next = indexRef.current >= maxIndex ? 0 : indexRef.current + 1
      scrollToIndex(next)
    }, AUTOPLAY_MS)
  }, [maxIndex, scrollToIndex])

  /* Démarre dès que le composant est monté et quand les reviews changent */
  useEffect(() => {
    if (total <= visibleCount) return
    startAutoplay()
    return () => clearInterval(timerRef.current)
  }, [total, visibleCount, startAutoplay])

  /* Reset au changement de reviews */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
    indexRef.current = 0
  }, [total])

  if (total === 0) return null

  const defaultTitle = lang === 'ar' ? 'آراء عملائنا' : 'Ce que disent nos clients'
  const slideW       = `calc(${100 / visibleCount}% - ${GAP * (visibleCount - 1) / visibleCount}px)`

  return (
    <section className="py-14 px-4">
      <style>{`.rev-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Titre */}
        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-px flex-1" style={{ background: PURPLE_XSOFT }} />
          <h2 className="text-2xl md:text-3xl font-black italic whitespace-nowrap"
            style={{ color: PURPLE }}>
            {title || defaultTitle}
          </h2>
          <div className="h-px flex-1" style={{ background: PURPLE_XSOFT }} />
        </div>

        {/* Scroll natif snap — sans flèches ni dots */}
        <div
          ref={scrollRef}
          className="rev-scroll"
          style={{
            display:                 'flex',
            gap:                     GAP,
            overflowX:               'scroll',
            scrollSnapType:          'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth:          'none',
            msOverflowStyle:         'none',
            borderRadius:            16,
          }}
        >
          {reviews.map((review) => (
            <div
              key={review._id}
              style={{
                flexShrink:      0,
                width:           slideW,
                aspectRatio:     '4/5',
                scrollSnapAlign: 'start',
                borderRadius:    16,
                overflow:        'hidden',
                border:          `1px solid ${PURPLE_XSOFT}`,
                background:      '#f5f3ff',
              }}
            >
              <img
                src={review.imageUrl}
                alt="Avis client"
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
