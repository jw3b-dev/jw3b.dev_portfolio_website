/*
 * The re-screen verdict  ·  audit-heuristics-engineer / app-ui-engineer
 *
 * Extracted from AuditConsole because it stopped being presentation the moment it had a rule in
 * it. The rule: a fix can clear the finding it targets AND introduce a different one, and when
 * that happens the panel must not read as success — `introduced` outranks `cleared` and leads the
 * sentence, because bad news reported second is bad news reported quietly.
 *
 * Before the delta existed, the verdict counted only findings matching the fix's own id. The
 * re-screen already knew what had happened to every other finding and discarded it, so the
 * console could print "re-screened, and the finding is gone" in success colours over a contract
 * that had just acquired a new problem — a false all-clear produced by the very surface whose
 * argument is that automated tools must not produce them.
 *
 * It still never claims the contract is safe. Clearing a pattern is clearing a pattern.
 */

/**
 * @param {{lastFix: {label:string, cleared:boolean, delta?:{resolved:string[], introduced:string[]}}}} props
 */
export default function FixVerdict({ lastFix }) {
  if (!lastFix) return null

  const introduced = lastFix.delta?.introduced ?? []
  const resolved = lastFix.delta?.resolved ?? []
  // The ONE line of logic here: success requires both that the target cleared and that nothing
  // new appeared. Either half alone is not good news.
  const good = lastFix.cleared && introduced.length === 0

  return (
    <div
      className={
        'mt-3 rounded-md border p-2 text-xs ' +
        (good ? 'border-verified/40 bg-verified/5 text-verified' : 'border-caution/40 bg-caution/5 text-caution')
      }
    >
      <p>
        {introduced.length > 0
          ? `Applied the rule-derived fix “${lastFix.label}” — and the re-screen now flags something it did not before. Read the findings again before trusting this edit.`
          : lastFix.cleared
            ? `Applied the rule-derived fix “${lastFix.label}” — re-screened, and the finding is gone. That clears one pattern; it is not an audit.`
            : `Applied the rule-derived fix “${lastFix.label}” — but the re-screen still flags it. Shown as-is rather than claimed as fixed.`}
      </p>
      {(resolved.length > 0 || introduced.length > 0) && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-label">
          {resolved.length > 0 && <span>resolved: {resolved.join(', ')}</span>}
          {resolved.length > 0 && introduced.length > 0 && <span> · </span>}
          {introduced.length > 0 && <span>introduced: {introduced.join(', ')}</span>}
        </p>
      )}
    </div>
  )
}
