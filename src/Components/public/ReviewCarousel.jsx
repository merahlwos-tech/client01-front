import { useState, useRef, useEffect } from 'react'
import { useLang } from '../../context/LanguageContext'

const PURPLE       = '#7c3aed'
const PURPLE_XSOFT = 'rgba(124,58,237,0.25)'

/* Nombre de slides visibles selon largeur écran */
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
  const [dragging, setDragging]     = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const trackRef    = useRef(null)
  const startX      = useRef(0)
  const startIndex  = useRef(0)

  const slideWidth = () => {
    if (!trackRef.current) return 0
    return trackRef.current.offsetWidth / visibleCount
  }

  const baseTranslate  = -index * slideWidth()
  const totalTranslate = baseTranslate + dragOffset

  /* ── TOUCH ── */
  const onTouchStart = (e) => {
    startX.current     = e.touches[0].clientX
    startIndex.current = index
    setDragging(true)
    setDragOffset(0)
  }

  const onTouchMove = (e) => {
    if (!dragging) return
    const diff = e.touches[0].clientX - startX.current
    setDragOffset(diff)
  }

  const onTouchEnd = () => snap()

  /* ── MOUSE (desktop) ── */
  const onMouseDown = (e) => {
    startX.current     = e.clientX
    startIndex.current = index
    setDragging(true)
    setDragOffset(0)
  }

  const onMouseMove  = (e) => { if (dragging) setDragOffset(e.clientX - startX.current) }
  const onMouseUp    = () => snap()
  const onMouseLeave = () => { if (dragging) snap() }

  /* ── Snap vers slide le plus proche ── */
  const snap = () => {
    const sw      = slideWidth()
    const moved   = -dragOffset
    const steps   = sw > 0 ? Math.round(moved / sw) : 0
    const newIdx  = Math.min(Math.max(startIndex.current + steps, 0), maxIndex)
    setIndex(newIdx)
    setDragging(false)
    setDragOffset(0)
  }

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

        {/* Fenêtre carrousel */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={trackRef}
            className="flex gap-4"
            style={{
              transform:  `translateX(${totalTranslate}px)`,
              transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
            }}
          >
            {reviews.map((review) => (
              <div
                key={review._id}
                className="flex-shrink-0 rounded-2xl overflow-hidden shadow-md"
                style={{
                  width:         `calc(${100 / visibleCount}% - ${(visibleCount - 1) * 16 / visibleCount}px)`,
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
