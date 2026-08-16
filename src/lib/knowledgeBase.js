/*
 * jw3b.dev v2 — Concierge KB generator (P1-03 · FR-018 · ADR-06 · BR-01/02)  ·  domain-engine
 * PURE. Turns the sealed evidence register (DE-07) into the concierge's grounding: the ONLY
 * facts the model may assert, plus the forbidden claims it must never make. There are NO
 * hand-authored numbers here — every figure is lifted verbatim from a CLEARED register entry
 * (same isCleared() gate the <Claim> UI uses, so the KB and the UI can never disagree on what
 * is provable). scripts/gen-knowledge.mjs serializes this into the Worker's knowledge.js; a
 * drift test fails CI if that generated file falls out of sync with the register.
 */
import { isCleared } from './claimsValidate.js'

/** One grounded fact derived from a cleared claim. Data only — no prose invented here. */
export function toFact(claim) {
  return {
    id: claim.id,
    label: claim.label,
    value: claim.value,
    source: claim.source_system || 'owner-attested',
    ownerAttested: /owner-attested/i.test(String(claim.evidence_pointer || '')),
    provenance: claim.provenance_note || null,
  }
}

/** Render one fact as a single grounding line (source + provenance attribution). */
export function factLine(fact) {
  const attrib = fact.ownerAttested ? `${fact.source}, owner-attested` : fact.source
  const prov = fact.provenance ? ` — ${fact.provenance}` : ''
  return `- ${fact.value} — ${fact.label} (source: ${attrib}${prov})`
}

/**
 * Assemble the concierge system prompt from the derived facts + forbidden list.
 * The boilerplate is the ONLY authored text; all specifics come from the register.
 */
export function assembleSystemPrompt(facts, forbidden) {
  const grounding = facts.map(factLine).join('\n')
  const forbiddenLines = forbidden.map((f) => `  - ${f}`).join('\n')
  return [
    'You are the concierge for John Wellard (JW3B / AgileGypsy) — a blockchain engineer and',
    "smart-contract security auditor. Answer visitors' questions about his work, record, and",
    'services concisely and factually.',
    '',
    'GROUNDING — the ONLY verified facts you may state. Every number, credential, metric, or',
    'dollar figure you assert MUST appear verbatim below, cited to its source:',
    grounding,
    '',
    'RULES:',
    '1. Never state any number, metric, credential, or figure that is not in GROUNDING above.',
    '   If asked for one you do not have, say you cannot verify it and point the visitor to the',
    '   audit console, the shipped systems, or the hire flow.',
    '2. NEVER make any of these claims — they are false, unverifiable, or forbidden:',
    forbiddenLines,
    '3. You are an AI assistant — say so if asked. Do not give financial or legal advice.',
    '4. Cite the source when you state a fact. When in doubt, understate rather than overstate.',
  ].join('\n')
}

/**
 * Build the concierge knowledge base from a register object.
 * @returns {{facts:Array, forbidden:string[], systemPrompt:string}}
 */
export function buildKnowledgeBase(register) {
  const claims = register && Array.isArray(register.claims) ? register.claims : []
  const forbidden = register && Array.isArray(register.forbidden) ? register.forbidden : []
  const facts = claims.filter(isCleared).map(toFact)
  return { facts, forbidden, systemPrompt: assembleSystemPrompt(facts, forbidden) }
}
