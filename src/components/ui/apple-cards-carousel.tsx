import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CarouselCardItem {
  id: string
  title: string
  category: string
  src: string
  price?: number
  badge?: string
  content?: React.ReactNode
}

export interface AppleCardsCarouselProps {
  items: CarouselCardItem[]
  onItemClick?: (item: CarouselCardItem) => void
  initialScroll?: number
}

export function AppleCardsCarousel({
  items,
  onItemClick,
  initialScroll = 0,
}: AppleCardsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeItem, setActiveItem] = useState<CarouselCardItem | null>(null)

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll
      checkScrollability()
    }
  }, [initialScroll])

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" })
      setTimeout(checkScrollability, 300)
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" })
      setTimeout(checkScrollability, 300)
    }
  }

  return (
    <div className="relative w-full py-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
            Curated Highlights
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="h-7 w-7 rounded-full border border-white/10 bg-[#0E1524] flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="h-7 w-7 rounded-full border border-white/10 bg-[#0E1524] flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        onScroll={checkScrollability}
        className="flex w-full overflow-x-auto gap-4 py-2 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => {
              if (onItemClick) onItemClick(item)
              else setActiveItem(item)
            }}
            className="relative h-64 w-56 sm:w-64 shrink-0 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 bg-[#131B2E] shadow-xl hover:border-indigo-500/50 transition-all duration-300"
          >
            <img
              src={item.src}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // Graceful placeholder on image error
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/60 to-transparent" />

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-indigo-300 backdrop-blur-md border border-white/10">
                {item.category}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  {item.badge}
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-left">
              <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2 drop-shadow-sm">
                {item.title}
              </h4>
              {item.price !== undefined && (
                <p className="text-xs font-mono font-bold text-cyan-400 mt-1">
                  ₹{item.price.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded Dialog preview if no custom click handler */}
      <AnimatePresence>
        {activeItem && !onItemClick && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0E1524] shadow-2xl"
            >
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={activeItem.src}
                alt={activeItem.title}
                className="h-64 w-full object-cover"
              />
              <div className="p-5">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  {activeItem.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {activeItem.title}
                </h3>
                {activeItem.price !== undefined && (
                  <p className="text-sm font-mono font-bold text-cyan-400 mt-2">
                    ₹{activeItem.price.toLocaleString("en-IN")}
                  </p>
                )}
                {activeItem.content && <div className="mt-3">{activeItem.content}</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
