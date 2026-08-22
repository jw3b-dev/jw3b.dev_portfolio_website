/*
 * Share a run  ·  app-ui-engineer  (brief 05, next-need 2)
 *
 * Export hands you a `.md` you can keep. This hands you a link a colleague can OPEN — and, more to
 * the point, one they can check: the contract travels in the URL fragment, so their browser
 * re-screens it and derives the findings itself instead of reading a list it has to trust.
 *
 * The fragment is the whole reason this is safe to offer. Browsers never send it to a server, so
 * the code in the link reaches nobody but the person holding the link — no row, no id, no
 * retention question, and the cookieless posture is untouched.
 *
 * When the source is too big to encode, the button is REPLACED by the reason and a pointer at the
 * export. A disabled button with no explanation is a dead end; a truncated contract would be worse
 * than either, because it would screen differently from the one the sender was looking at.
 */
import { useState } from 'react'
import { permalinkFor, permalinkRefusal } from '../../lib/runPermalink.js'

export default function ShareRun({ source, origin }) {
  const [copied, setCopied] = useState(false)
  const refusal = permalinkRefusal(source)

  if (refusal) {
    return <span className="font-mono text-[10px] uppercase tracking-label text-caution">{refusal}</span>
  }

  const base = origin ?? (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '')
  const url = permalinkFor(source, base)
  if (!url) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied (permission, insecure context, older browser). Say nothing false —
      // leave the label alone so the visitor can see it did not work and select the URL manually.
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copies a link containing this contract in the URL fragment — a fragment is never sent to any server"
      className="rounded-md border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
    >
      {copied ? 'Link copied' : 'Copy link to this run'}
    </button>
  )
}
