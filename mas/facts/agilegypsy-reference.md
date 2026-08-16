# AgileGypsy.com — Brand & Design Reference

> Read-only extraction from `/home/agilegypsy/code/projects/agilegypsy-website`
> (Next.js 16 / OpenNext / Tailwind v4, live at agilegypsy.com), captured to inform the
> from-scratch visual redesign of the **sibling** site **jw3b.dev** (John's personal portfolio).
>
> **Relationship:** agilegypsy.com is the **studio brand**; jw3b.dev is the **person**. They should
> share brand DNA and quality bar but stay distinct identities. This doc is a source of *ingredients
> and rigor*, not a skin to clone.

---

## 0. Two token systems live in this repo — use the right one

- **LIVE brand = `app/globals.css` `@theme inline`** — "Deep Current / Bioluminescence" direction:
  **orange-led** (`#FF8C00`) + **purple** (`#9D4EDD`) over deep ocean-space, cyan (`#00E5FF`) accent.
  This is the current AgileGypsy site. **This is the reference.**
- **LEGACY = `lib/design-system/tokens.ts`** — "Kointel — Amethyst & Deep Space", **purple-led**
  (`#A855F7` / `#D946EF`). This is a *product sub-brand* (Kointel), not the site brand. Its
  structure (token budget, scales) is worth copying; its *palette is not*. Don't let jw3b.dev
  accidentally inherit the amethyst hues from here.

---

## 1. Design Tokens (concrete values)

### Color — Backgrounds ("The Void")
| Token | Value | Note |
|---|---|---|
| `--color-void-black` | `#02040A` | near-black, navbar bg base |
| `--color-void-base` | `#0A0D14` | page base |
| `--color-void-surface` | `#101624` | surface |
| `--color-void-hover` | `#162033` | surface hover |
| `body` background | `#02060d` | actual painted body color (bluer than void-black) |
| `themeColor` (meta) | `#030303` | |

### Color — Brand & Accents
| Token | Value | Role |
|---|---|---|
| `--color-brand` | `#FF8C00` | **primary brand = orange** (CTAs, glows, focus of identity) |
| `--color-brand-glow` | `#FF8C00` | brand glow |
| `--color-brand-deep` | `#9D4EDD` | **purple** — the brand's second pole |
| `--color-brand-subtle` | `rgba(255,140,0,0.1)` | orange tint fills |
| `--color-accent-cyan` | `#00E5FF` | HUD / instrumentation cyan |
| `--color-accent-blue` | `#1e88e5` | |
| `--color-accent-orange` | `#FF8C00` | |
| `--color-accent-crimson` | `#E11D48` | security/danger accent |
| `--color-zar-gold` | `#FBBF24` | domain (ZAR currency) |
| `--color-sars-red` | `#DC2626` | domain (tax) |
| `--color-destructive` | `#EF4444` | |
| eyebrow cyan (hardcoded) | `#41d9ff` | the `.eyebrow` label color |

### Color — Text
| Token | Value |
|---|---|
| `--color-text-primary` | `#FFFFFF` |
| `--color-text-secondary` | `#A1A1AA` |
| `--color-text-muted` | `#52525B` |
| `--color-text-inverse` | `#000000` |
| body copy in practice | `text-slate-400` (`#94a3b8`) is the workhorse muted body color |

### Color — Borders / Glass
| Token | Value |
|---|---|
| `--color-border-subtle` | `rgba(255,255,255,0.05)` |
| `--color-border-white` | `rgba(255,255,255,0.15)` |
| glass panel bg | `rgba(255,255,255,0.02)` |
| glass hairline "light catch" | `border-top: rgba(255,255,255,0.1)` |

### Per-discipline accent map (drives cards, nav dots, glows — one accent per surface)
This is the most transferable idea in the whole system. Each service/product owns **one** accent:
| Discipline | Accent |
|---|---|
| Tokenomics & Ecosystem | `#9d4edd` (purple) |
| Regulatory & Compliance | `#00e5ff` (cyan) |
| Smart-Contract Security | `#ff8c00` (orange) |
| Governed Delivery | `#b06bff` (light violet) |
| Whitepaper & BA | `#41d9ff` (sky) |
| Tokenomics/Viability Audit | `#ff5e7e` (coral) |
| Governance/Ecosystem Audit | `#41d9ff` (sky) |
| Agentic AI (skills group) | `#41D9FF` |
| Security (skills group) | `#E11D48` |

### The signature "audit gradient" (a spectrum across the disciplines)
```
linear-gradient(90deg, #00F2FF 0%, #9C27B0 50%, #FF7B25 100%)   /* .grad, cyan→magenta→orange */
```
Used on **exactly one emphasis phrase per page hero** (art-director rule: "spend your boldness in
one place / one accent per surface"). All other headings render solid white. Amethyst text gradient
also exists: `linear-gradient(135deg, #FF8C00 0%, #9D4EDD 100%)` (`.text-gradient-amethyst`).

### Typography
| Role | Family | CSS var | Usage |
|---|---|---|---|
| **Display/Headings** | **Orbitron** | `--font-orbitron` | `.heading-brand` — UPPERCASE, `letter-spacing:0.06em`, `line-height:1.18`, weight 700, color `#eef3f9`. THE brand voice. |
| **Numbers/subhead** | **Space Grotesk** | `--font-display` | stat values, card titles, `.text-display` (weight 700, `-0.025em`) |
| Body/sans | **Inter** | `--font-geist-sans` | body copy, nav (13px) |
| Mono | **JetBrains Mono** | `--font-geist-mono` | stats labels, tech chips, timestamps, technical proof strings |
| Eyebrow | Inter | — | `.eyebrow`: 0.75rem, weight 600, `letter-spacing:0.3em`, UPPERCASE, color `#41d9ff` |
Weights loaded: Inter 300–800, Orbitron 400–900, Space Grotesk 400–700, JetBrains 400/500/700.

### Spacing / Radius / Elevation
- **Spacing**: 8-point grid, `--space-1..32` = `0.25rem → 8rem` (1,2,3,4,6,8,10,12,16,20,24,32).
- **Radius**: `sm .375rem · md .5rem · lg .75rem · xl 1rem · 2xl 1.5rem · pill 9999px`. In practice cards use ~`22px` (`.card-neo`), buttons `14px`, chips pill.
- **Elevation (z)**: base 0, dropdown 50, sticky 60, modal-backdrop 70, modal 80, popover 90, toast 100, tooltip 110.

### Blur / Shadow / Glass
- **Blur scale**: subtle 4px · light 8px · medium 16px · heavy 24px · extreme 40px. Ambient mesh blobs use `blur(100px)`.
- **Glass opacity**: subtle .03 · light .05 · medium .10 · heavy .20.
- **Shadows**: `sm 0 1px 2px rgba(0,0,0,.4)` · `md 0 4px 12px` · `lg 0 10px 24px rgba(0,0,0,.5)` · `glow-brand 0 0 20px rgba(168,85,247,.3)` · `glow-cyan 0 0 20px rgba(6,182,212,.3)`.

### Motion
| Durations | | Easings | |
|---|---|---|---|
| instant | 100ms | standard | `cubic-bezier(.4,0,.2,1)` |
| fast | 200ms | decelerate | `cubic-bezier(0,0,.2,1)` |
| normal | 350ms | accelerate | `cubic-bezier(.4,0,1,1)` |
| slow | 600ms | **out-expo** | `cubic-bezier(.16,1,.3,1)` (hero rise / cards) |
| glacial | 1200ms | **spring** | `cubic-bezier(.34,1.56,.64,1)` (chip hover) |

Stagger tokens: fast 50ms · normal 100ms · slow 200ms. Signature keyframes: `rise` (hero entrance,
per-child `animation-delay` 0.05→0.4s), `float-slow` (9s octopus idle), `bloom`, `ambient-pulse`
(8s), `beam-rotate` (conic border beam, 4s), `glow-breathing`, `chip-bob`. Full
`prefers-reduced-motion` reset present. Smooth-scroll via **Lenis**; motion via **Framer Motion +
GSAP**.

---

## 2. Brand Voice & Positioning (actual quoted copy)

**Master tagline (hero H1):** "**Proof, not promises.**" — "promises" wrapped in the cyan→magenta→orange `.grad`.

**One-line definition (meta + hero):**
> "A Web3 tokenomics, ecosystem, compliance and security consultancy — with AI and graph modeling
> stitched through every engagement. Proof, not promises: we encode the constraint, then keep the receipts."

**Hero eyebrow:** "Web3 tokenomics · ecosystem · compliance · security"

**Hero body:**
> "…We encode the constraint so the system can't violate it, then keep the receipts — including the
> launches we scored and told founders to stop."

**Recurring rally cries (used as section headings):**
- "**Model it, then prove it.**" / "Model it. Prove it. Then launch." (final CTA)
- "**Encode the constraint. Keep the receipts.**"
- "The boundary is executable. The failures are published." (Why-us H2)
- "One architect. Institutional discipline." (the John section)
- "We are building trust infrastructure." (values H2)
- "Ready to prove your economy?" (About CTA)

**The octopus metaphor (Services intro) — directly analogous to jw3b.dev's thesis:**
> "**Like the octopus — one mind, many arms.** Four consulting lines and three independent audits —
> modelled as graphs, proven in code, with AI stitched through every engagement."

**Proof-culture triad (Why-us cards):** "Executable boundaries" · "Proofs, not assertions" · "Published failures" — with lines like:
> "Every audit finding ships with a reproducible exploit… If we can't prove it, we don't claim it."
> "We score our own ventures and publish the ones we stopped — a launch that scored 245/1000…"

**Studio identity:** Legal/brand name **"AgileGypsy Labs"** (siteName in OG); the person is **John
Wellard**, alias **"AgileGypsy"**, titled **"Founder & Chief Architect"**, "APMG AgilePM®
Practitioner", "Benoni-based tokenomics and ecosystem architect working globally." Registered
Information Officer (POPIA). Cross-links to `jw3b.dev` as his personal `url` in Person schema — the
two sites already reference each other.

**Voice characteristics:** engineer-credible, evidence-obsessed, quietly confident, anti-hype.
Every claim is a number tied to a receipt (audit report, test-coverage %, deliverable count). It
brags by *disclosing its own failures* ("the launches we told founders to stop"). No marketing
fluff; the flex is rigor. Copy leans on em-dashes and short declaratives.

---

## 3. Information Architecture & Page Structure

**Route groups (Next App Router):**
- `(marketing)` — public site: `/` (home), `/services` + `/services/[service]`, `/products` +
  `/products/[product]`, `/portfolio` + `/portfolio/[slug]`, `/ai`, `/labs`, `/pricing`, `/blog` +
  `/blog/[slug]`, `/about`, `/contact`, `/company/{about,people,contact}`, `/legal/{privacy,terms,popia,paia-manual}`.
- `(auth)` — `/login /signup /forgot /reset` (own layout).
- `(dash)` — `/dash` gated dashboard.
- `/api/*` — large backend surface (auth, payments/PayFast ITN, prices, tax engine, transactions, import, admin director/daemon, support chat+speak).
- `/share/[token]`, `/ref/[code]`, `/md/[...slug]`, `/preview`.

**Nav model (`agile-navbar.tsx`)** — fixed, `bg-[#02040A]/75 backdrop-blur-xl backdrop-saturate-150`, 64px (`h-16`), hairline bottom border `white/[0.06]`:
- Left: octopus mark (logo, 36px). Desktop items: **Services** (2-col mega-menu: Consulting / Audit groups) · **Products** (dropdown) · **AI** · **Labs** · **Pricing** · **About** (dropdown: Portfolio / The Studio / Insights / Contact).
- Every dropdown leaf carries a **colored dot = that item's accent** (`box-shadow: 0 0 8px <accent>`). This is how the per-discipline accent system surfaces in navigation.
- Right: pill CTA "**Book a call**" (ghost pill, hover → orange border/tint).
- Mobile: full-screen panel, accent dots preserved, `btn-primary` CTA at bottom.

**Home page composition (order):** HeroOctopus → StackStrip (tech ticker) → ServicesOverview →
LeadArchitectSection → ProductsOverview → Case-study band → SecuritySection → BlogTeaser → FAQ →
Final CTA. Consistent rhythm: `py-28` sections, `max-w-7xl` container, eyebrow → `heading-brand` H2
→ light `text-slate-400` intro → content grid.

**About page composition:** Hero (stats row) → Mission (narrative w/ orange left-border rule) →
"What we do" (5 pillar cards) → Values (hairline rows) → Team (single-person HUD card w/ cert
chips) → CTA.

---

## 4. UI / UX Patterns Worth Carrying

- **`.card-neo`** — the signature card: glass gradient `linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,.015))`, `blur(12px)`, `border-radius:22px`, per-card `--card-accent` CSS var that drives a radial glow (`::after`), and on hover lifts `translateY(-4px)` + accent-tinted border and outer glow via `color-mix`. **Accent is data-driven per instance.**
- **`.hud-corners`** — instrument-panel framing: L-shaped corner ticks (`::before`/`::after`, 14px, `rgba(255,255,255,.25)`) on stat/proof panels. Reads as "readout", not "marketing card".
- **HUD stat readouts** — grids of mono numbers, each in its own accent color, with tiny UPPERCASE eyebrow labels (`tracking:0.18em`). Numbers do the talking; every figure is a claim.
- **`.aurora`** — per-section ambient wash (`::before` radial-gradients in teal/purple/orange) to kill dead-black between sections. **`.ambient-mesh-bg`** — two `blur(100px)` orange+purple blobs, `ambient-pulse` 8s.
- **`.rays`** — cinematic diagonal light-ray overlays on heroes.
- **`.border-beam-container`** — animated conic-gradient border "beam" rotating around a card via `@property --beam-angle` + mask trick (orange→purple sweep).
- **`.arm-chip`** — floating pill chips (mono, per-chip `--chip-accent`, glow + `chip-bob` bob) "anchored at the octopus arms" — labels that orbit the mascot. Conceptually = "hang the pillar labels off the central figure."
- **Buttons:** `.btn-primary` = orange gradient `linear-gradient(120deg,#ff8a3d,#ff5e00)`, radius 14px, big soft orange shadow, hover lift; `.btn-ghost` = glass + blue-tinted hairline border.
- **`.eyebrow`** — cyan (`#41d9ff`) UPPERCASE 0.3em-tracked micro-label opening almost every section.
- **Section dividers** — `.section-gradient-divider` (purple→amber→purple hairline).
- **Tech ticker (`StackStrip`)** — horizontal scroll of mono pill tags ("Neo4j, Foundry, Solidity, Cloudflare Workers…"): credibility-by-stack, no client logos.
- **Numbered engagement flow** — vertical timeline with gradient spine (`from-[#FF8C00]/60 via-[#9D4EDD]/40 to-[#00E5FF]/30`) and node dots.
- **Canvas/WebGL:** hand-rolled 2D-canvas `bg-canvas.tsx` (220 stars w/ twinkle, 3 orbital rings, 70 drifting particles in brand colors, radial nebula blobs) + `tentacle-canvas.tsx` / `starfield-canvas.tsx`. No R3F/Three here — it's Canvas 2D. The **octopus mascot** is a `.webp` (static ~68KB / animated ~3.8MB), `mix-blend-screen`, `float-slow`, orange drop-shadow glow.
- **CTA pattern:** every page ends with eyebrow → big `heading-brand` → light subcopy → dual buttons (primary "Book a technical call" + ghost `mailto:`) over a radial orange/purple floor glow, plus a mono microline ("Gauteng, ZA · UTC+2 · response within 1 business day").
- **Dark-only:** `<html class="dark">`, no light theme. Custom thin dark scrollbars. `::selection` orange (`orange-500/30`). Focus ring = cyan 2px.

---

## 5. Aesthetic Character (the feel in a few sentences)

AgileGypsy reads as a **deep-ocean control room**: near-black blue-space backgrounds (`#02060d`)
lit by bioluminescent aurora washes — teal, violet, and a signature warm **orange** — with a
glowing octopus mascot drifting in the current as the emotional center. The surface language is
**premium glassmorphism** (translucent cards, hairline "light-catch" top borders, generous
`blur`) crossed with **HUD instrumentation** (corner ticks, mono readouts, accent-coded stat grids)
so it feels like *evidence on an instrument panel*, not a brochure. **Orbitron** sets an uppercase,
wide-tracked, cyber-institutional headline voice; **Space Grotesk** numbers and **JetBrains Mono**
labels reinforce the "measured, technical, receipts-attached" tone. Boldness is **rationed** — one
cyan→magenta→orange gradient phrase per hero, one accent color per surface — so the whole thing
stays restrained and expensive-feeling rather than neon-loud. Overall: **serious, evidence-driven,
cyber-oceanic; confident enough to lead with its own failures.**

---

## 6. Carry vs. Keep-Distinct (for jw3b.dev)

**CARRY the DNA & rigor:**
1. **"One mind, many arms" → "one person, all pillars visible at once."** The octopus/"one
   architect, many disciplines" thesis is *the same idea* jw3b.dev is built on. Carry the *concept*
   and the honesty ("all visible at once, never hidden").
2. **One-accent-per-pillar system, surfaced as dots + card glows + gradient spines.** This maps 1:1
   onto jw3b.dev's Web3 Data · Security · AI/Modeling · Tokenomics themes. Reuse the *mechanism*
   (`--card-accent`/`--chip-accent` data-driven glow; colored nav dots), pick jw3b's own hues.
3. **HUD-instrument treatment for proof:** corner ticks, mono stat readouts, accent-colored numbers,
   the "spend boldness in one place" gradient-phrase discipline. This is how the shared quality bar
   reads. (Note jw3b.dev already uses `.text-gradient-audit` cyan→magenta→orange — same DNA.)
4. **Evidence-first voice:** "Proof, not promises," every number tied to a receipt, brag-by-disclosing-failures.
   jw3b.dev's claims-discipline (CodeHawks #124 · 17 findings · 1,430 EXP) fits this exactly.
5. **Motion vocabulary:** `out-expo` staggered entrances, slow idle float on the hero figure,
   ambient aurora washes to avoid dead-black, `spring` micro-interactions, full reduced-motion reset.

**Keep DISTINCT (so the sites don't blur):**
1. **Don't reuse the octopus mascot or Orbitron headline face.** The octopus + "AGILEGYPSY" Orbitron
   wordmark = the *studio's* identity. jw3b.dev is the *person* — give it its own central figure
   (the brief calls for **R3F/Three.js 3D beats**, which the studio site deliberately does *not*
   have — it's Canvas 2D). A real WebGL/R3F hero is the natural way to differentiate on craft.
2. **Shift the palette off orange-primary.** AgileGypsy is unmistakably **orange-led**. jw3b.dev
   should lead with a *different* signature (per-pillar spectrum with its own anchor hue), so a
   viewer never mistakes the portfolio for the studio. Share the *deep-space glass + HUD* substrate;
   differ on the accent identity and the 3D dimensionality.

---

*Files read (read-only, unmodified): `app/globals.css`, `lib/design-system/tokens.ts`, `app/fonts.ts`,
`app/layout.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/about/page.tsx`,
`components/landing/{hero-octopus,agile-navbar,stack-strip,security-section,lead-architect-section,bg-canvas,faq}.tsx`,
`components/services/services-overview.tsx`, `components/brand/agilegypsy-logo.tsx`, `lib/services/service-data.ts`.*
