import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const PURPLE       = '#7c3aed'
const PURPLE_XSOFT = 'rgba(124,58,237,0.25)'
const GAP          = 16

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

  const [index, setIndex] = useState(0)
  const scrollRef         = useRef(null)

  const getStep = useCallback(() => {
    const el = scrollRef.current
    if (!el) return 0
    const slideW = (el.offsetWidth - GAP * (visibleCount - 1)) / visibleCount
    return slideW + GAP
  }, [visibleCount])

  const goTo = useCallback((idx) => {
    const el = scrollRef.current
    if (!el) return
    const clamped = Math.min(Math.max(idx, 0), maxIndex)
    el.scrollTo({ left: clamped * getStep(), behavior: 'smooth' })
    setIndex(clamped)
  }, [getStep, maxIndex])

  /* Sync index avec le scroll réel (swipe natif) */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let timer
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const step = getStep()
        if (step > 0) setIndex(Math.round(el.scrollLeft / step))
      }, 50)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  }, [getStep])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
    setIndex(0)
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

        <div className="relative">

          {/* Flèche gauche */}
          {index > 0 && (
            <button onClick={() => goTo(index - 1)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10
                         rounded-full shadow-lg flex items-center justify-center
                         transition-all hover:scale-110 active:scale-95"
              style={{ background: 'white', border: `2px solid ${PURPLE_XSOFT}`, color: PURPLE }}>
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Flèche droite */}
          {index < maxIndex && (
            <button onClick={() => goTo(index + 1)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10
                         rounded-full shadow-lg flex items-center justify-center
                         transition-all hover:scale-110 active:scale-95"
              style={{ background: 'white', border: `2px solid ${PURPLE_XSOFT}`, color: PURPLE }}>
              <ChevronRight size={20} />
            </button>
          )}

          {/* Scroll natif avec snap */}
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

        {/* Dots */}
        {total > visibleCount && (
          <div className="flex justify-center gap-2 mt-5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width:        i === index ? 24 : 8,
                  height:       8,
                  borderRadius: 9999,
                  background:   i === index ? PURPLE : PURPLE_XSOFT,
                  border:       'none',
                  cursor:       'pointer',
                  transition:   'all 0.3s',
                  padding:      0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
