import { ArrowRight } from 'lucide-react'
import BoomerangVideoBg from './BoomerangVideoBg'

const FEATURES = [
  { number: '01', label: 'Conversational' },
  { number: '02', label: 'Connected' },
  { number: '03', label: 'Compliant' },
]

export default function Hero() {
  return (
    <section id="product" className="relative flex h-screen flex-col items-center overflow-hidden">
      <BoomerangVideoBg />

      {/* ---------------- Copy ---------------- */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-24 text-center sm:px-6 sm:pt-26 md:pt-32 [@media(max-height:900px)]:md:pt-24 [@media(max-height:820px)]:md:pt-20">
        <h1 className="font-serif text-4xl font-normal leading-[1.1] tracking-tighter text-[#191919] sm:text-5xl md:text-7xl lg:text-8xl">
          Build lasting
          <br />
          relationships.
        </h1>

        <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#191919]/70 sm:mt-6 sm:max-w-md md:mt-8 md:text-base [@media(max-height:900px)]:md:mt-5">
          Conversational AI platform for modern financial institutions — agents that handle the full
          borrower lifecycle across email, SMS, and voice.
        </p>

        <a
          href="/app.html"
          className="mt-6 rounded-lg bg-[#191919] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#191919]/90 sm:mt-8 sm:px-8 sm:py-3.5 md:mt-10 [@media(max-height:900px)]:md:mt-6"
        >
          Book A Demo
        </a>
      </div>

      {/* ---------------- Bottom panel ---------------- */}
      <div className="relative z-10 mt-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="overflow-hidden border border-b-0 border-gray-200 bg-white/90 px-5 pb-0 pt-8 shadow-sm backdrop-blur-sm sm:px-8 sm:pt-12 md:px-12 md:pt-16 [@media(max-height:900px)]:md:pt-10 [@media(max-height:820px)]:md:pt-8">
          {/* Row 1 */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#191919]/50">
                What do we do?
              </p>
              <h2 className="mt-3 font-serif text-2xl font-normal leading-tight tracking-tight text-[#191919] sm:text-3xl md:text-4xl">
                Conversations that
                <span className="hidden sm:inline">
                  <br />
                </span>{' '}
                build momentum
              </h2>
            </div>

            <div className="flex items-end">
              <p className="text-sm leading-relaxed text-[#191919]/70 md:text-[15px]">
                Conversational AI built for regulated financial institutions. Agents that hold a real
                conversation, plug into the systems you run, and show their work.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 h-px w-full bg-gray-200 sm:mt-8 md:mt-10 [@media(max-height:900px)]:md:mt-7" />

          {/* Row 2 */}
          <div className="grid gap-2 pb-0 pt-6 sm:grid-cols-3 sm:gap-3 sm:pt-8 md:pt-10 [@media(max-height:900px)]:md:pt-7">
            {FEATURES.map((feature) => (
              <a
                key={feature.number}
                href="/app.html"
                className="group flex cursor-pointer items-center justify-between gap-3 bg-[#F4F3F3] px-4 py-3.5 transition-all duration-200 hover:bg-[#eaeaea] sm:px-6 sm:py-4"
              >
                <span className="flex items-baseline">
                  <span className="text-[#191919]/40">{feature.number}</span>
                  <span className="mx-2 text-[#191919]/30">/</span>
                  <span className="font-medium text-[#191919]">{feature.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-700" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
