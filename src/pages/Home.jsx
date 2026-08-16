import Seo from '../components/seo/Seo.jsx'
import Hero from '../components/hero/Hero.jsx'
import FourHats from '../components/identity/FourHats.jsx'
import CodeHawksLink from '../components/proof/CodeHawksLink.jsx'
import DeliveryAnchor from '../components/proof/DeliveryAnchor.jsx'
import FailuresSurface from '../components/proof/FailuresSurface.jsx'

// Home / marquee route. The operable, proof-first hero (P1-09) leads; the four-hat
// identity (P1-11, FR-003) and the credibility surfaces (P1-14: CodeHawks #124 deep-link
// FR-044 + PM/Founder delivery anchor FR-060) follow. Further brief sections mount later.
export default function Home() {
  return (
    <>
      <Seo />
      <Hero />
      <FourHats className="mx-auto max-w-6xl px-5 pt-16 sm:px-8" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <CodeHawksLink />
        <DeliveryAnchor />
      </div>
      <FailuresSurface className="mx-auto max-w-6xl px-5 pb-20 sm:px-8" />
    </>
  )
}
