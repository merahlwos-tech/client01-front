import { useState, useRef, useEffect, useCallback } from 'react'
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

  const [index, setIndex]           = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const containerRef = useRef(null)
  const startX       = useRef(0)
  const startIndex   = useRef(0)
  const dragRef      = useRef(false)   // version ref de isDragging pour les listeners natifs

  /* Largeur d'un pas (slide + gap) */
  const getStep = useCallback(() => {
    if (!containerRef.current) return 0
    const w = containerRef.current.offsetWidth
    return (w - GAP * (visibleCount - 1)) / visibleCount + GAP
  }, [visibleCount])

  /* Snap au relâchement */
  const snap = useCallback((offset) => {
    const step   = getStep()
    const steps  = step > 0 ? Math.round(-offset / step) : 0
    const newIdx = Math.min(Math.max(startIndex.current + steps, 0), maxIndex)
    setIndex(newIdx)
    setDragOffset(0)
    setIsDragging(false)
    dragRef.current = false
  }, [getStep, maxIndex])

  /* ── Listeners natifs touch (passive:false obligatoire pour preventDefault) ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e) => {
      startX.current     = e.touches[0].clientX
      startIndex.current = index
      dragRef.current    = true
      setIsDragging(true)
      setDragOffset(0)
    }

    const handleTouchMove = (e) => {
      if (!dragRef.current) return
      e.preventDefault()   // BLOQUE le scroll page — fonctionne car passive:false
      const offset = e.touches[0].clientX - startX.current
      setDragOffset(offset)
    }

    const handleTouchEnd = () => {
      if (!dragRef.current) return
      setDragOffset(prev => { snap(prev); return prev })
    }

    el.addEventListener('touchstart',  handleTouchStart, { passive: true })
    el.addEventListener('touchmove',   handleTouchMove,  { passive: false })
    el.addEventListener('touchend',    handleTouchEnd,   { passive: true })

    return () => {
      el.removeEventListener('touchstart',  handleTouchStart)
      el.removeEventListener('touchmove',   handleTouchMove)
      el.removeEventListener('touchend',    handleTouchEnd)
    }
  }, [index, snap])

  /* ── Mouse (desktop) ── */
  const onMouseDown = (e) => {
    startX.current     = e.clientX
    startIndex.current = index
    dragRef.current    = true
    setIsDragging(true)
    setDragOffset(0)
  }
  const onMouseMove = (e) => {
    if (!dragRef.current) return
    setDragOffset(e.clientX - startX.current)
  }
  const onMouseUp = () => {
    if (!dragRef.current) return
    setDragOffset(prev => { snap(prev); return prev })
  }
  const onMouseLeave = () => {
    if (dragRef.current) onMouseUp()
  }

  useEffect(() => { setIndex(0) }, [total])

  if (total === 0) return null

  const defaultTitle = lang === 'ar' ? 'آراء عملائنا' : 'Ce que disent nos clients'
  const translate    = -index * getStep() + dragOffset
  const slideW       = `calc(${100 / visibleCount}% - ${GAP * (visibleCount - 1) / visibleCount}px)`

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

        {/* Container */}
        <div
          ref={containerRef}
          className="overflow-hidden rounded-2xl"
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Track */}
          <div
            className="flex"
            style={{
              gap:        GAP,
              transform:  `translateX(${translate}px)`,
              transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
            }}
          >
            {reviews.map((review) => (
              <div
                key={review._id}
                className="flex-shrink-0 rounded-2xl overflow-hidden shadow-md"
                style={{
                  width:         slideW,
                  aspectRatio:   '4/5',
                  border:        `1px solid ${PURPLE_XSOFT}`,
                  background:    '#f5f3ff',
                  pointerEvents: 'none',
                }}
              >
                <img
                  src={review.imageUrl}
                  alt="Avis client"
                  draggable={false}
                  className="w-full h-full object-cover"
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
                onClick={() => setIndex(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === index ? 24 : 8,
                  height:     8,
                  background: i === index ? PURPLE : PURPLE_XSOFT,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
