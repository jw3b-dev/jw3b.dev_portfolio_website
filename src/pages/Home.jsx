import Hero from '../components/hero/Hero.jsx'
import FourHats from '../components/identity/FourHats.jsx'

// Home / marquee route. The operable, proof-first hero (P1-09) leads; the four-hat
// identity surface (P1-11, FR-003) follows — one operator, four hats, shown together.
// Further brief 03/04/07 sections mount beneath as they land.
export default function Home() {
  return (
    <>
      <Hero />
      <FourHats className="mx-auto max-w-6xl px-5 py-16 sm:px-8" />
    </>
  )
}
