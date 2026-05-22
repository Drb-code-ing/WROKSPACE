import { motion } from 'framer-motion'

export default function PromoBanner() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-orange-700 px-8 py-16 text-center shadow-2xl sm:px-16"
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative z-10">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block rounded-full bg-white/20 px-5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
            >
              🎉 Limited Time Offer
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="mt-6 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl"
            >
              Free delivery on your first order
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="mx-auto mt-4 max-w-lg text-lg text-white/80"
            >
              Use code <span className="rounded-lg bg-white/20 px-3 py-1 font-bold text-white">WELCOME</span> at
              checkout and get your first meal delivered completely free.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="mt-8"
            >
              <a
                href="#download"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-brand-600 shadow-xl transition-all duration-200 hover:bg-gray-100 hover:shadow-2xl active:scale-[0.97]"
              >
                Claim your free delivery
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="mt-4 text-sm text-white/60"
            >
              No minimum order. Valid for new users only. T&Cs apply.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
