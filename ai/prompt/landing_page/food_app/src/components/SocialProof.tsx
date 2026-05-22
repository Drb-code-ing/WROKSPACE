import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const partners = [
  'Burger House', 'Pizza Roma', 'Sushi Wok',
  'Taco Bell', 'KFC', 'Subway',
]

const testimonials = [
  {
    name: 'Sarah Chen',
    handle: '@sarahc',
    avatar: 'SC',
    color: 'bg-brand-500',
    quote: 'Foodiez saved my busy evenings. The tracking is so accurate I know exactly when to open the door!',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    handle: '@marcusj',
    avatar: 'MJ',
    color: 'bg-blue-500',
    quote: 'The personalized recommendations are scary accurate. Found 5 new favorite spots this month.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    handle: '@priyap',
    avatar: 'PP',
    color: 'bg-green-500',
    quote: 'Thirty minutes or less — every single time. I don\'t know how they do it, but I love it.',
    rating: 5,
  },
]

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function SocialProof() {
  const testimonialRef = useRef(null)
  const isInView = useInView(testimonialRef, { once: true, margin: '-80px' })

  return (
    <section id="reviews" className="bg-white py-20 lg:py-28">
      <div className="container-section">
        {/* Partner logos */}
        <div className="mb-16 text-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Featured Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {partners.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 text-gray-300 transition-colors hover:text-gray-400"
              >
                <span className="text-lg font-black tracking-tight">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial cards */}
        <div ref={testimonialRef} className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <StarRating count={t.rating} />
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.handle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
