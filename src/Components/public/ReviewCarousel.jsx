import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LanguageContext'

const PURPLE       = '#7c3aed'
const PURPLE_XSOFT = 'rgba(124,58,237,0.25)'
const GAP          = 16
const AUTOPLAY_MS  = 4500   // intervalle autoplay
const PAUSE_MS     = 4000   // pause après interaction manuelle

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

  const scrollRef    = useRef(null)
  const indexRef     = useRef(0)
  const timerRef     = useRef(null)
  const pauseRef     = useRef(null)
  const isPaused     = useRef(false)

  const getStep = useCallback(() => {
    const el = scrollRef.current
    if (!el) return 0
    return (el.offsetWidth - GAP * (visibleCount - 1)) / visibleCount + GAP
  }, [visibleCount])

  /* Déplace le scroll vers un index précis */
  const scrollToIdx = useCallback((idx) => {
    const el = scrollRef.current
    if (!el) return
    indexRef.current = idx
    el.scrollTo({ left: idx * getStep(), behavior: 'smooth' })
  }, [getStep])

  /* Lance l'autoplay */
  const startAutoplay = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (isPaused.current) return
      const next = indexRef.current >= maxIndex ? 0 : indexRef.current + 1
      scrollToIdx(next)
    }, AUTOPLAY_MS)
  }, [maxIndex, scrollToIdx])

  /* Pause temporaire après interaction (reprend après PAUSE_MS) */
  const pauseTemporarily = useCallback(() => {
    isPaused.current = true
    clearTimeout(pauseRef.current)
    pauseRef.current = setTimeout(() => {
      isPaused.current = false
    }, PAUSE_MS)
  }, [])

  /* Sync indexRef sur le scroll réel (swipe natif) */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let debounce
    const onScroll = () => {
      pauseTemporarily()
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        const step = getStep()
        if (step > 0) indexRef.current = Math.round(el.scrollLeft / step)
      }, 80)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(debounce) }
  }, [getStep, pauseTemporarily])

  /* Démarre l'autoplay */
  useEffect(() => {
    if (total <= visibleCount) return
    startAutoplay()
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(pauseRef.current)
    }
  }, [total, visibleCount, startAutoplay])

  /* Reset quand les reviews changent */
  useEffect(() => {
    indexRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
  }, [total])

  if (total === 0) return null

  const defaultTitle = lang === 'ar' ? 'آراء عملائنا' : 'Ce que disent nos clients'
  const slideW       = `calc(${100 / visibleCount}% - ${GAP * (visibleCount - 1) / visibleCount}px)`

  return (
    <section className="py-14 px-4">
      <style>{`.rev-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="max-w-5xl mx-auto">

        {/* Titre — RTL uniquement pour le texte */}
        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="h-px flex-1" style={{ background: PURPLE_XSOFT }} />
          <h2 className="text-2xl md:text-3xl font-black italic whitespace-nowrap"
            style={{ color: PURPLE }}>
            {title || defaultTitle}
          </h2>
          <div className="h-px flex-1" style={{ background: PURPLE_XSOFT }} />
        </div>

        {/*
          IMPORTANT : dir="ltr" TOUJOURS sur le scroll container.
          En RTL le navigateur inverse scrollLeft → le carousel part de la fin.
          On force LTR ici et on gère l'affichage du texte séparément.
        */}
        <div
          ref={scrollRef}
          className="rev-scroll"
          dir="ltr"
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
