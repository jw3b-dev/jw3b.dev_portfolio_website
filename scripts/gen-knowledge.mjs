#!/usr/bin/env node
/*
 * jw3b.dev v2 — KB build step (P1-03, ADR-06)  ·  domain-engine
 * Generates workers/portfolio-agent/src/knowledge.js from the sealed evidence register by
 * running the PURE generator (src/lib/knowledgeBase.js). Run: `npm run gen:knowledge`.
 * The generated file is committed so the Worker imports it directly; a drift test
 * (src/lib/__tests__/knowledgeBase.test.js) fails CI if it ever falls out of sync.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildKnowledgeBase } from '../src/lib/knowledgeBase.js'

const here = dirname(fileURLToPath(import.meta.url))
const registerPath = resolve(here, '../src/data/evidence-register.json')
const outPath = resolve(here, '../workers/portfolio-agent/src/knowledge.js')

const register = JSON.parse(readFileSync(registerPath, 'utf8'))
const { facts, forbidden, systemPrompt } = buildKnowledgeBase(register)

const banner =
  '/*\n' +
  ' * AUTO-GENERATED — DO NOT EDIT. Source: src/data/evidence-register.json (sealed register).\n' +
  ' * Regenerate with `npm run gen:knowledge`. Drift is CI-blocking (knowledgeBase.test.js).\n' +
  ' * jw3b.dev v2 — concierge KB grounding (P1-03, FR-018, ADR-06). domain-engine.\n' +
  ' */\n'

const body =
  banner +
  `export const KNOWLEDGE_BASE = ${JSON.stringify({ facts, forbidden }, null, 2)}\n\n` +
  `export const conciergeSystemPrompt = ${JSON.stringify(systemPrompt)}\n`

writeFileSync(outPath, body)
console.log(`gen-knowledge: wrote ${outPath} (${facts.length} facts, ${forbidden.length} forbidden)`)
