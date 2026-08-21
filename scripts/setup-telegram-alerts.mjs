#!/usr/bin/env node
/*
 * setup-telegram-alerts — wire the lead-alert channel without a token ever touching chat, a
 * commit, or a terminal echo.
 *
 * WHY THIS EXISTS. Until 2026-08-21 a completed hire request on jw3b.dev reached nobody: the row
 * went into D1 and no notification path existed. `notify.js` fixed the code; this script does the
 * provisioning half, because the failure mode of "set a secret by hand" is a half-configured
 * channel — a token with no chat id, or a chat id from the wrong bot — which fails silently in
 * exactly the way the original defect did.
 *
 * WHAT IT DOES
 *   1. Reads the bot token from a GITIGNORED file (default: workers/portfolio-agent/.telegram)
 *      or the TELEGRAM_BOT_TOKEN env var. Never printed, never echoed, never committed.
 *   2. Validates it against getMe, and prints the bot's @username (safe, public).
 *   3. Discovers the chat id from getUpdates — you send the bot one message first.
 *   4. Sets BOTH worker secrets via wrangler (piped to stdin, so no shell history, no argv).
 *   5. Sends a real test alert so the channel is proven end-to-end, not assumed.
 *
 * SETUP (once):
 *   a. In Telegram, message @BotFather → /newbot → give it a name and a username.
 *   b. Save the token it returns:
 *        echo '<token>' > workers/portfolio-agent/.telegram
 *   c. Open your new bot in Telegram and press START (or send it any message).
 *   d. npm run telegram:setup
 *   e. Delete the file when it reports success — the secret lives in Cloudflare now:
 *        rm workers/portfolio-agent/.telegram
 *
 * Re-run any time to rotate the token or re-point the chat.
 */
import { readFileSync, existsSync } from 'fs'
import { execFileSync } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WORKER = resolve(root, 'workers/portfolio-agent')
const TOKEN_FILE = resolve(WORKER, '.telegram')
const WORKER_NAME = 'portfolio-agent'

const die = (msg) => {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

/** The token, from the gitignored file or the environment. Never logged. */
function readToken() {
  if (process.env.TELEGRAM_BOT_TOKEN?.trim()) return process.env.TELEGRAM_BOT_TOKEN.trim()
  if (!existsSync(TOKEN_FILE)) {
    die(
      `No bot token found.\n\n` +
        `  1. Telegram → @BotFather → /newbot → name it (e.g. "jw3b.dev leads")\n` +
        `  2. echo '<the token BotFather gives you>' > ${TOKEN_FILE.replace(root + '/', '')}\n` +
        `  3. Open your new bot and press START\n` +
        `  4. npm run telegram:setup`,
    )
  }
  const raw = readFileSync(TOKEN_FILE, 'utf8').trim()
  if (!/^\d+:[\w-]{30,}$/.test(raw)) die('That file does not look like a Telegram bot token (expected `123456:ABC-...`).')
  return raw
}

async function api(token, method, params = {}) {
  const url = `https://api.telegram.org/bot${token}/${method}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  const body = await res.json().catch(() => ({}))
  if (!body.ok) die(`Telegram ${method} failed: ${body.description || res.status}`)
  return body.result
}

/** Set one worker secret by piping the value to wrangler's stdin — never argv, never history. */
function putSecret(name, value) {
  execFileSync('npx', ['wrangler@4', 'secret', 'put', name, '--name', WORKER_NAME, '--config', 'wrangler.toml'], {
    cwd: WORKER,
    input: value,
    stdio: ['pipe', 'ignore', 'inherit'],
  })
  console.log(`   ✓ ${name} set on ${WORKER_NAME}`)
}

const token = readToken()

console.log('\nTelegram lead alerts — setup\n' + '─'.repeat(56))

const me = await api(token, 'getMe')
console.log(`Bot: ${me.first_name} (@${me.username})`)

// A bot only sees chats that have messaged it, so this doubles as proof that the START landed.
const updates = await api(token, 'getUpdates', { limit: 100 })
const chats = new Map()
for (const u of updates) {
  const m = u.message || u.edited_message || u.channel_post || u.my_chat_member
  if (m?.chat) chats.set(m.chat.id, m.chat)
}

if (chats.size === 0) {
  die(
    `The bot has no messages yet, so its chat id cannot be discovered.\n\n` +
      `  Open @${me.username} in Telegram, press START, then re-run:\n` +
      `    npm run telegram:setup\n\n` +
      `(If you pressed START a while ago, send it any message — Telegram only keeps\n` +
      ` recent updates, and a previous run may have consumed them.)`,
  )
}

if (chats.size > 1) {
  console.log('\nMultiple chats have messaged this bot:')
  for (const c of chats.values()) console.log(`  ${c.id}  ${c.type}  ${c.username || c.title || c.first_name || ''}`)
  die('Ambiguous target. Re-run with the one you want:  TELEGRAM_CHAT_ID=<id> npm run telegram:setup')
}

const chat = process.env.TELEGRAM_CHAT_ID
  ? { id: process.env.TELEGRAM_CHAT_ID, type: 'override' }
  : [...chats.values()][0]
console.log(`Chat: ${chat.id} (${chat.type}${chat.username ? ` · @${chat.username}` : ''})`)

console.log('\nSetting worker secrets…')
putSecret('TELEGRAM_BOT_TOKEN', token)
putSecret('TELEGRAM_CHAT_ID', String(chat.id))

// Prove the channel works rather than declaring it configured. This is the whole point: the
// original defect was a path everyone assumed worked and nobody exercised.
console.log('\nSending a test alert…')
await api(token, 'sendMessage', {
  chat_id: chat.id,
  parse_mode: 'HTML',
  text:
    '✅ <b>jw3b.dev lead alerts are live.</b>\n\n' +
    'This is the channel that fires when someone completes the hire flow — ' +
    'engagement requests and book-a-call submissions both land here, with the ' +
    'contact and their assessment answers.\n\n' +
    '<i>Test message from `npm run telegram:setup`.</i>',
})

console.log(`   ✓ sent — check @${me.username} in Telegram`)
console.log(
  `\nDone. Delete the token file now that Cloudflare holds it:\n` +
    `   rm ${TOKEN_FILE.replace(root + '/', '')}\n`,
)
