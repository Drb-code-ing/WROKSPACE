import { motion } from 'framer-motion'

const features = [
  {
    title: 'Real-time order tracking',
    description:
      'Watch your order move from the kitchen to your door with live GPS tracking. Know exactly when your rider picks up and when they\'re pulling onto your street — no more hovering by the window.',
    image: (
      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Map mockup */}
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800">Live Tracking</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">LIVE</span>
            </div>
            <div className="relative h-32 rounded-xl bg-gray-100">
              {/* Dotted route */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 128" fill="none">
                <path d="M20 100 Q60 20 100 50 T180 30" stroke="#FF6B35" strokeWidth="2" strokeDasharray="4 3" />
                <circle cx="20" cy="100" r="6" fill="#FF6B35" />
                <circle cx="180" cy="30" r="6" fill="#22C55E" />
                <circle cx="100" cy="50" r="5" fill="#FF6B35" className="animate-pulse" />
              </svg>
              <div className="absolute bottom-2 left-2 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold shadow">
                🛵 2 min away
              </div>
              <div className="absolute bottom-2 right-2 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold shadow">
                📍 Your door
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-gray-600">Rider is approaching — get ready!</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Personalized recommendations',
    description:
      'Our AI learns your taste buds. Whether you\'re craving Thai on a Tuesday or pizza on a Friday, Foodiez serves up dishes tailored to your mood, time of day, and past orders.',
    image: (
      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Recommended for you</span>
            <span className="text-[10px] text-brand-500">See all →</span>
          </div>
          {[
            { name: 'Spicy Ramen', emoji: '🍜', match: '95%' },
            { name: 'Pad Thai', emoji: '🍝', match: '92%' },
            { name: 'Margherita Pizza', emoji: '🍕', match: '88%' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow-sm backdrop-blur"
            >
              <span className="text-lg">{item.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: item.match }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-brand-600">{item.match}</span>
            </div>
          ))}
          <div className="rounded-xl bg-white/60 p-3 text-center text-[11px] text-gray-400 shadow-sm">
            Based on your recent orders &middot; Updated daily
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Lightning-fast checkout',
    description:
      'Save your payment details and delivery address once, then checkout in a single tap. No forms, no fuss — just pure speed from cart to confirmation.',
    image: (
      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="w-full max-w-sm space-y-4">
          {/* Order summary */}
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h4 className="mb-3 text-xs font-bold text-gray-500">Order Summary</h4>
            <div className="space-y-2">
              {[
                { name: 'Double Cheeseburger', qty: 'x2', price: '$24' },
                { name: 'Large Fries', qty: 'x1', price: '$6' },
                { name: 'Milkshake', qty: 'x1', price: '$5' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} <span className="text-gray-400">{item.qty}</span></span>
                  <span className="font-semibold">{item.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t pt-3 text-sm font-bold">
              <span>Total</span>
              <span>$35.00</span>
            </div>
          </div>
          {/* Checkout button */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Place Order — $35.00
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Exclusive local restaurants',
    description:
      'Discover hidden gems that haven\'t made it to the big delivery platforms yet. We partner with neighborhood kitchens so you get access to the best food your city has to offer — no delivery minimums, no markup.',
    image: (
      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 p-8">
        <div className="w-full max-w-sm space-y-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-[10px] font-bold text-brand-600">Exclusive on Foodiez</span>
          </div>
          {[
            { name: "Mama's Kitchen", badge: 'New', cuisine: 'Home-style Italian' },
            { name: 'Dragon Wok', badge: 'Popular', cuisine: 'Authentic Sichuan' },
            { name: 'The Taco Stand', badge: 'Exclusive', cuisine: 'Street-style Mexican' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow-sm backdrop-blur"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-base font-bold text-brand-600">
                {item.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  {item.badge && (
                    <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{item.cuisine}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function FeatureHighlights() {
  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="container-section text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-semibold uppercase tracking-widest text-brand-600"
        >
          Why Foodiez
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="section-heading mt-2"
        >
          Built for speed, powered by taste
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="section-subheading mx-auto"
        >
          Every feature is designed to get you from hungry to happy in record time.
        </motion.p>
      </div>

      <div className="mt-14 space-y-16 lg:space-y-28">
        {features.map((feature, i) => {
          const isReversed = i % 2 === 1

          return (
            <div
              key={feature.title}
              className="container-section"
            >
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  isReversed ? 'lg:direction-rtl' : ''
                }`}
              >
                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={isReversed ? 'lg:order-2' : ''}
                >
                  <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                    {feature.description}
                  </p>
                </motion.div>

                {/* Image / visual */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={isReversed ? 'lg:order-1' : ''}
                >
                  <div className="overflow-hidden rounded-3xl shadow-xl">
                    {feature.image}
                  </div>
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
