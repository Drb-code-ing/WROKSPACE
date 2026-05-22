import { motion } from 'framer-motion'

export default function FinalCTA() {
  return (
    <section id="download" className="bg-gray-900 py-20 lg:py-28">
      <div className="container-section text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl"
        >
          Download Foodiez and get your{' '}
          <span className="text-brand-400">food faster than ever</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-lg text-gray-400"
        >
          Join 500,000+ happy users in your city. Fresh food, fast delivery,
          zero hassle.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#download"
            className="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-gray-900 shadow-xl transition-all duration-200 hover:bg-gray-100 active:scale-[0.97]"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Download for iOS
          </a>
          <a
            href="#download"
            className="inline-flex items-center gap-3 rounded-xl border-2 border-gray-700 bg-transparent px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-200 hover:border-gray-500 hover:bg-gray-800 active:scale-[0.97]"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            Download for Android
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-sm text-gray-500"
        >
          Free on the App Store &middot; Available on Google Play
        </motion.p>
      </div>
    </section>
  )
}
