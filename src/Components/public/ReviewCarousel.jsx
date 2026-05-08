import { useState, useRef, useEffect, useCallback } from 'react'

import { useLang } from '../../context/LanguageContext'

const PURPLE       = '#7c3aed'
const PURPLE_XSOFT = 'rgba(124,58,237,0.25)'
const GAP          = 16   // px — correspond à gap-4

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
  const [dragOffset, setDragOffset] = useState(0)

  // useRef pour ne pas déclencher de re-render pendant le drag
  const isDragging   = useRef(false)
  const startX       = useRef(0)
  const startIndex   = useRef(0)
  const containerRef = useRef(null)   // ← ref sur le div overflow-hidden

  /* Largeur d'un "pas" = largeur d'une slide + son gap */
  const getSlideStep = useCallback(() => {
    if (!containerRef.current) return 0
    const containerW = containerRef.current.offsetWidth
    // (containerW - total des gaps) / nb slides + 1 gap
    return (containerW - GAP * (visibleCount - 1)) / visibleCount + GAP
  }, [visibleCount])

  /* Translation du track en px */
  const getTranslate = useCallback((idx, offset = 0) => {
    return -idx * getSlideStep() + offset
  }, [getSlideStep])

  /* Snap au slide le plus proche au relâchement */
  const snap = useCallback(() => {
    const step   = getSlideStep()
    const steps  = step > 0 ? Math.round(-dragOffset / step) : 0
    const newIdx = Math.min(Math.max(startIndex.current + steps, 0), maxIndex)
    setIndex(newIdx)
    setDragOffset(0)
    isDragging.current = false
  }, [dragOffset, getSlideStep, maxIndex])

  /* ── TOUCH (mobile) ── */
  const onTouchStart = (e) => {
    startX.current     = e.touches[0].clientX
    startIndex.current = index
    isDragging.current = true
    setDragOffset(0)
  }
  const onTouchMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()   // bloque le scroll vertical pendant le swipe horizontal
    setDragOffset(e.touches[0].clientX - startX.current)
  }
  const onTouchEnd = () => snap()

  /* ── MOUSE (desktop) ── */
  const onMouseDown = (e) => {
    startX.current     = e.clientX
    startIndex.current = index
    isDragging.current = true
    setDragOffset(0)
  }
  const onMouseMove = (e) => {
    if (!isDragging.current) return
    setDragOffset(e.clientX - startX.current)
  }
  const onMouseUp    = () => { if (isDragging.current) snap() }
  const onMouseLeave = () => { if (isDragging.current) snap() }

  /* Reset si les reviews changent */
  useEffect(() => { setIndex(0) }, [total])

  if (total === 0) return null

  const defaultTitle = lang === 'ar' ? 'آراء عملائنا' : 'Ce que disent nos clients'
  const isActive     = isDragging.current && dragOffset !== 0
  const slideW       = `calc(${100 / visibleCount}% - ${GAP * (visibleCount - 1) / visibleCount}px)`

  return (
    <section className="py-14 px-4">
      <div className="max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── Titre ── */}
        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-px flex-1" style={{ background: PURPLE_XSOFT }} />
          <h2 className="text-2xl md:text-3xl font-black italic whitespace-nowrap"
            style={{ color: PURPLE }}>
            {title || defaultTitle}
          </h2>
          <div className="h-px flex-1" style={{ background: PURPLE_XSOFT }} />
        </div>

        {/* ── Container (overflow hidden) ── */}
        <div
          ref={containerRef}
          className="overflow-hidden rounded-2xl"
          style={{
            cursor:      isActive ? 'grabbing' : 'grab',
            userSelect:  'none',
            touchAction: 'none',   // désactive le scroll natif pendant le swipe
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* ── Track (défilant) ── */}
          <div
            className="flex"
            style={{
              gap:        GAP,
              transform:  `translateX(${getTranslate(index, dragOffset)}px)`,
              transition: isActive ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
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
                  pointerEvents: 'none',   // empêche le drag natif des images
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

        {/* ── Dots ── */}
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
