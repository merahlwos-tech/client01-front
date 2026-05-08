import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const PURPLE      = '#7c3aed'
const NAVY        = '#1e1b4b'
const PURPLE_XSOFT = 'rgba(124,58,237,0.25)'

/* Nombre d'items visibles selon la largeur */
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
  const { lang, isRTL }  = useLang()
  const [index, setIndex]   = useState(0)
  const [paused, setPaused] = useState(false)
  const visibleCount         = useVisibleCount()
  const timerRef             = useRef(null)
  const touchStartX          = useRef(null)

  const total = reviews.length
  const maxIndex = Math.max(0, total - visibleCount)

  const next = useCallback(() => {
    setIndex(i => (i >= maxIndex ? 0 : i + 1))
  }, [maxIndex])

  const prev = useCallback(() => {
    setIndex(i => (i <= 0 ? maxIndex : i - 1))
  }, [maxIndex])

  /* Swipe tactile */
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    setPaused(true)
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev()
    }
    touchStartX.current = null
    setPaused(false)
  }
  useEffect(() => {
    if (paused || total <= visibleCount) return
    timerRef.current = setInterval(next, 3000)
    return () => clearInterval(timerRef.current)
  }, [paused, total, visibleCount, next])

  /* Reset index si les reviews changent */
  useEffect(() => { setIndex(0) }, [total])

  if (total === 0) return null

  const defaultTitle = lang === 'ar' ? 'آراء عملائنا' : 'Ce que disent nos clients'

  return (
    <section className="py-14 px-4">
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

        {/* Carrousel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Bouton précédent */}
          {total > visibleCount && (
            <button
              onClick={prev}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10
                         rounded-full flex items-center justify-center shadow-lg
                         transition-all hover:scale-110"
              style={{ background: 'white', border: `2px solid ${PURPLE_XSOFT}`, color: PURPLE }}
              aria-label="Précédent"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Fenêtre de défilement */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(${isRTL ? '' : '-'}${index * (100 / visibleCount)}%)`,
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="flex-shrink-0 rounded-2xl overflow-hidden shadow-md
                             hover:shadow-xl transition-shadow duration-300"
                  style={{
                    width:  `calc(${100 / visibleCount}% - ${(visibleCount - 1) * 16 / visibleCount}px)`,
                    aspectRatio: '4/5',
                    border: `1px solid ${PURPLE_XSOFT}`,
                    background: '#f5f3ff',
                  }}
                >
                  <img
                    src={review.imageUrl}
                    alt="Avis client"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bouton suivant */}
          {total > visibleCount && (
            <button
              onClick={next}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10
                         rounded-full flex items-center justify-center shadow-lg
                         transition-all hover:scale-110"
              style={{ background: 'white', border: `2px solid ${PURPLE_XSOFT}`, color: PURPLE }}
              aria-label="Suivant"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Indicateurs (dots) */}
        {total > visibleCount && (
          <div className="flex justify-center gap-2 mt-5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === index ? 24 : 8,
                  height:     8,
                  background: i === index ? PURPLE : PURPLE_XSOFT,
                }}
                aria-label={`Aller à ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
