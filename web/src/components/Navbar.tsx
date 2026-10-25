import Logo from './Logo'

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Company', href: '#company' },
]

export default function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4 sm:px-10 sm:py-5 md:px-14">
        {/* Left — brand */}
        <a href="/" className="flex items-center gap-2.5" aria-label="Boomerang home">
          <Logo className="h-6 w-6 text-[#191919]" />
          <span className="text-base font-semibold tracking-tight text-[#191919]">Boomerang</span>
        </a>

        {/* Centre — links */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[#191919]/70 transition-colors duration-200 hover:text-[#191919]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — CTA */}
        <a
          href="/app.html"
          className="rounded-lg bg-[#191919] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#191919]/90"
        >
          Book A Demo
        </a>
      </div>
    </header>
  )
}
