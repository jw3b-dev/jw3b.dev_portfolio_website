// AI security console route (P1-08). The operable audit surface (FR-011/FR-014).
import Seo from '../components/seo/Seo.jsx'
import AuditConsole from '../components/audit/AuditConsole.jsx'

export default function Audit() {
  return (
    <section aria-labelledby="audit-title" className="mx-auto max-w-6xl px-4 py-10">
      <Seo
        title="AI Security Console"
        description="Paste a Solidity contract for an instant deterministic heuristic screen and an AI-assisted analysis — John Wellard's operable smart-contract auditor."
      />
      <h1 id="audit-title" className="text-2xl font-semibold text-content-primary">
        AI security console
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-content-secondary">
        Paste a Solidity contract for a deterministic first-pass screen and an AI-assisted analysis.
        The heuristics run instantly and stay real even if the live model is offline.
      </p>
      <div className="mt-8">
        <AuditConsole />
      </div>
    </section>
  )
}
