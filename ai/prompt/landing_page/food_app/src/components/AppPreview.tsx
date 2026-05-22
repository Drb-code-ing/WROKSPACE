import { motion } from 'framer-motion'
import { useRef } from 'react'

const screens = [
  {
    label: 'Browse',
    emoji: '🍽️',
    description: 'Discover restaurants near you',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2">
          <span className="text-sm">🔍</span>
          <span className="text-[10px] text-gray-400">Search dishes or restaurants...</span>
        </div>
        {['Burger House', 'Pizza Roma', 'Sushi Wok'].map((name, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-600">
              {name.charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-800">{name}</p>
              <p className="text-[9px] text-gray-400">{['0.5 mi', '1.2 mi', '0.8 mi'][i]}</p>
            </div>
            <span className="ml-auto text-[10px] text-yellow-500">★ 4.{['9', '8', '9'][i]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: 'Order',
    emoji: '📋',
    description: 'Customize your meal',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl bg-brand-500 p-2 text-center">
          <p className="text-[10px] font-bold text-white">Double Cheeseburger</p>
          <p className="text-[8px] text-white/70">$12.00</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5">
            <span className="text-[9px] text-gray-600">Extra cheese</span>
            <span className="text-[9px] font-semibold">+$1.50</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5">
            <span className="text-[9px] text-gray-600">Bacon add-on</span>
            <span className="text-[9px] font-semibold">+$2.00</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5">
            <span className="text-[9px] text-gray-600">Large fries</span>
            <span className="text-[9px] font-semibold">+$3.50</span>
          </div>
        </div>
        <div className="rounded-xl bg-brand-100 p-2 text-center text-[9px] font-bold text-brand-700">
          Add to cart — $15.50
        </div>
      </div>
    ),
  },
  {
    label: 'Track',
    emoji: '🛵',
    description: 'Real-time delivery tracking',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-[9px] font-semibold text-green-700">Rider picked up your order</span>
        </div>
        <div className="relative h-24 rounded-xl bg-gray-100">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 150 96" fill="none">
            <path d="M15 75 Q45 15 75 40 T135 25" stroke="#FF6B35" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="15" cy="75" r="5" fill="#FF6B35" />
            <circle cx="135" cy="25" r="5" fill="#22C55E" />
            <circle cx="75" cy="40" r="4" fill="#FF6B35" className="animate-pulse" />
          </svg>
          <div className="absolute bottom-1 left-1 rounded-md bg-white px-1.5 py-0.5 text-[8px] font-semibold shadow">
            🛵 5 min
          </div>
          <div className="absolute bottom-1 right-1 rounded-md bg-white px-1.5 py-0.5 text-[8px] font-semibold shadow">
            📍 Home
          </div>
        </div>
        <div className="rounded-xl bg-white p-2 text-center text-[9px] text-gray-400 shadow-sm">
          ETA: 8:12 PM
        </div>
      </div>
    ),
  },
  {
    label: 'Review',
    emoji: '⭐',
    description: 'Rate and share your experience',
    content: (
      <div className="space-y-3">
        <p className="text-center text-[10px] font-bold text-gray-700">How was your meal?</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <textarea
          readOnly
          value="Amazing burger! 🍔"
          className="w-full resize-none rounded-xl bg-gray-50 p-2 text-[9px] text-gray-500"
          rows={2}
        />
        <div className="rounded-xl bg-brand-500 p-2 text-center text-[9px] font-bold text-white">
          Submit Review
        </div>
      </div>
    ),
  },
]

export default function AppPreview() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="container-section text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-semibold uppercase tracking-widest text-brand-600"
        >
          App Preview
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="section-heading mt-2"
        >
          See Foodiez in action
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="section-subheading mx-auto"
        >
          Swipe through the app experience — from browsing to unboxing.
        </motion.p>
      </div>

      {/* Horizontal scrollable phones */}
      <div
        ref={scrollRef}
        className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-8 sm:px-8 lg:px-16"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {screens.map((screen, i) => (
          <motion.div
            key={screen.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="snap-start shrink-0"
          >
            <div className="h-[480px] w-[240px] overflow-hidden rounded-[2rem] border-[3px] border-gray-800 bg-white shadow-2xl">
              {/* Notch */}
              <div className="mx-auto h-5 w-24 rounded-b-2xl bg-gray-800" />
              <div className="p-3 pt-1.5">
                {/* Screen label */}
                <div className="mb-3 text-center">
                  <span className="text-base">{screen.emoji}</span>
                  <h3 className="text-xs font-bold text-gray-800">{screen.label}</h3>
                  <p className="text-[9px] text-gray-400">{screen.description}</p>
                </div>
                {/* Screen content */}
                {screen.content}
              </div>
              {/* Home indicator */}
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gray-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="mt-6 text-center text-xs text-gray-400">
        ← Scroll to explore screens →
      </div>
    </section>
  )
}
