const footerLinks = [
  {
    label: 'Product',
    links: ['How it works', 'Restaurants', 'Pricing', 'FAQ'],
  },
  {
    label: 'Company',
    links: ['About', 'Blog', 'Careers', 'Press'],
  },
  {
    label: 'Support',
    links: ['Help Center', 'Contact', 'Safety', 'Terms & Privacy'],
  },
]

const socialIcons = [
  {
    name: 'Twitter',
    path: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    path: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.11 2.525c.636-.247 1.363-.416 2.427-.465C8.83 2.013 9.184 2 11.615 2h.7zm-.08 1.802h-.7c-2.397 0-2.68.009-3.628.052-1.17.054-1.806.249-2.229.414a2.724 2.724 0 00-1.012.648 2.724 2.724 0 00-.648 1.012c-.165.423-.36 1.059-.414 2.229-.043.948-.052 1.23-.052 3.628v.7c0 2.397.009 2.68.052 3.628.054 1.17.249 1.806.414 2.229.158.397.358.718.648 1.012.294.29.615.49 1.012.648.423.165 1.059.36 2.229.414.947.043 1.231.052 3.628.052h.7c2.397 0 2.68-.009 3.628-.052 1.17-.054 1.806-.249 2.229-.414a2.724 2.724 0 001.012-.648 2.724 2.724 0 00.648-1.012c.165-.423.36-1.059.414-2.229.043-.947.052-1.23.052-3.628v-.7c0-2.397-.009-2.68-.052-3.628-.054-1.17-.249-1.806-.414-2.229a2.724 2.724 0 00-.648-1.012 2.724 2.724 0 00-1.012-.648c-.423-.165-1.059-.36-2.229-.414-.947-.043-1.231-.052-3.628-.052zm-2.823 4.783a4.036 4.036 0 014.087 4.088 4.036 4.036 0 01-4.087 4.087 4.036 4.036 0 01-4.088-4.087 4.036 4.036 0 014.088-4.088zm0 1.803a2.233 2.233 0 00-2.285 2.285 2.233 2.233 0 002.285 2.284 2.233 2.233 0 002.284-2.284 2.233 2.233 0 00-2.284-2.285zm4.768-2.622a.964.964 0 11-.002 1.928.964.964 0 01.002-1.928z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    path: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-16 lg:py-20">
      <div className="container-section">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-black text-white">
                F
              </span>
              <span className="text-xl font-extrabold text-white">Foodiez</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
              Your favorite food, delivered fast. Order from 1,200+ restaurants in
              your area and enjoy lightning-fast delivery, right to your door.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex gap-4">
              {socialIcons.map((icon) => (
                <a
                  key={icon.name}
                  href="#"
                  aria-label={icon.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 text-gray-400 transition-all duration-200 hover:bg-brand-500 hover:text-white"
                >
                  {icon.path}
                </a>
              ))}
            </div>

            {/* Store buttons (mobile only) */}
            <div className="mt-6 flex flex-wrap gap-3 md:hidden">
              <a href="#download" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-gray-900 transition-all hover:bg-gray-100">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                App Store
              </a>
              <a href="#download" className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-gray-800">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
                Google Play
              </a>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.label}>
              <h4 className="mb-4 text-sm font-bold text-white">{group.label}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 transition-colors hover:text-brand-400"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Foodiez. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
