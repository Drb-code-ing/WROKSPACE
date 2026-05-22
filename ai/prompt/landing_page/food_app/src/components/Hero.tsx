import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' },
  }),
}

const floatingVariants = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

const floatingVariants2 = {
  animate: {
    y: [0, 12, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
  },
}

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brand-50/60 to-white pt-24 sm:pt-28">
      {/* Decorative blob */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-brand-500/5 blur-3xl" />

      <div className="container-section relative grid items-center gap-12 pt-8 lg:grid-cols-2 lg:pt-12">
        {/* Left — Text */}
        <div className="max-w-xl">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-block rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600"
          >
            #1 Food Delivery App of 2026
          </motion.span>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Your favorite food,{' '}
            <span className="bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
              delivered fast
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-4 text-lg leading-relaxed text-gray-600 sm:text-xl"
          >
            Cravings don't wait — neither do we. Order from 1,200+ restaurants in
            your area and get piping-hot meals at your doorstep in under 30 minutes.
          </motion.p>

          {/* Store buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-8 flex flex-wrap gap-4"
          >
            <a
              href="#download"
              className="btn-primary gap-3 px-8 py-4 text-base"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Download for iOS
            </a>
            <a
              href="#download"
              className="btn-secondary gap-3 px-8 py-4 text-base"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              Download for Android
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-10 flex flex-wrap items-center gap-8 border-t border-gray-100 pt-8"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">
                4.9 <span className="text-gray-400">(15k+ ratings)</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                30
              </span>
              <span className="font-medium">Min delivery</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                1.2k
              </span>
              <span className="font-medium">Restaurants</span>
            </div>
          </motion.div>
        </div>

        {/* Right — Phone mockup + floating cards */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mx-auto flex items-center justify-center lg:mx-0"
        >
          {/* Phone frame */}
          <div className="relative z-10">
            <div className="mx-auto h-[520px] w-[260px] overflow-hidden rounded-[2.5rem] border-[4px] border-gray-800 bg-white shadow-2xl sm:h-[580px] sm:w-[290px]">
              {/* Notch */}
              <div className="mx-auto h-6 w-28 rounded-b-2xl bg-gray-800" />
              {/* Screen content */}
              <div className="p-4 pt-3">
                {/* Status bar */}
                <div className="mb-4 flex justify-between text-xs font-semibold text-gray-500">
                  <span>9:41</span>
                  <span className="flex gap-1">
                    <span className="inline-block h-3 w-3 rounded-full border border-gray-400" />
                    <span className="inline-block h-3 w-2 rounded-sm bg-gray-400" />
                  </span>
                </div>
                {/* App content */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800">Near you 🔥</h3>
                  {[
                    { name: 'Burger House', time: '12 min', rating: '4.9' },
                    { name: 'Pizza Roma', time: '18 min', rating: '4.8' },
                    { name: 'Sushi Wok', time: '8 min', rating: '4.9' },
                    { name: 'Taco Bell', time: '14 min', rating: '4.7' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-base font-bold text-brand-600">
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.time} away</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-yellow-500">
                        ★ {item.rating}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bottom nav */}
                <div className="mt-4 flex justify-around border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                  <span className="font-bold text-brand-500">Home</span>
                  <span>Search</span>
                  <span>Orders</span>
                  <span>Profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating card 1 */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute -left-4 top-12 z-20 hidden rounded-2xl bg-white p-4 shadow-xl sm:block lg:-left-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">
                🛵
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Order on the way</p>
                <p className="text-[10px] text-gray-400">2 min away</p>
              </div>
            </div>
          </motion.div>

          {/* Floating card 2 */}
          <motion.div
            variants={floatingVariants2}
            animate="animate"
            className="absolute -right-4 bottom-12 z-20 hidden rounded-2xl bg-white p-4 shadow-xl sm:block lg:-right-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg">
                🍕
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Free delivery</p>
                <p className="text-[10px] text-gray-400">First order only</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
