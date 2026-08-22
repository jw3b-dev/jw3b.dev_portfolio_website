// Selected-work route (FR-004) — the four operable flagships get their own destination.
// frontend-engineer. The showcase owns the page's <h1>; this route adds per-route SEO.
import Seo from '../components/seo/Seo.jsx'
import FlagshipShowcase from '../components/flagships/FlagshipShowcase.jsx'

export default function Work() {
  return (
    <>
      <Seo
        title="Work"
        description="Four operable flagships — KTHULHU (autonomous smart-contract auditor), the on-site AI console, the Overmind governed agent engine, and Kointel — shipped systems you can run, not slideware."
      />
      <FlagshipShowcase />
    </>
  )
}
