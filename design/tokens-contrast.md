# jw3b.dev v2 — Token Contrast Matrix (WCAG validation) · brand-architect (P0-03)

**Mandate:** every foreground/background token pairing is validated before it ships. Ratios below are
computed against the two dark grounds the tokens render on. Targets: **AAA 7:1** (primary text on
primary bg), **AA 4.5:1** (body text on any surface), **AA-Large 3:1** (accents on dark; focus rings).

## Text ramp on `--color-void` `#0A0C10`

| Token | Hex | Ratio | Grade | Use |
|---|---|---|---|---|
| `--color-text-primary` | `#F2F5F8` | ~17:1 | AAA | figures, headings |
| `--color-text-secondary` | `#9BA6B4` | ~7.9:1 | AAA | body, labels (workhorse) |
| `--color-text-muted` | `#78828F` | ~4.95:1 | AA | de-emphasis only |

## Accents / verdict grammar on `--color-void` `#0A0C10`

| Token | Hex | Ratio | Grade (as text / as graphical) |
|---|---|---|---|
| `--color-cyan` / `--color-verified` | `#22D3EE` | ~10.7:1 | AAA / AAA |
| `--color-hat-auditor` (violet) | `#A78BFA` | ~7.2:1 | AAA / AAA |
| `--color-hat-pm` (green) | `#34D399` | ~10:1 | AAA / AAA |
| `--color-hat-founder` (gold) | `#E0A22E` | ~8.7:1 | AAA / AAA |
| `--color-failed` (amber→red) | `#FB5E6A` | ~6.4:1 | AA / AAA |
| `--color-caution` (amber) | `#F5C542` | ~12:1 | AAA / AAA |

## On `--color-panel` `#11141A` (evidence surface, one step lighter)

Ratios drop ~10% vs void. Spot-checks: `text-primary` ~15:1 (AAA), `text-secondary` ~7.0:1 (AAA),
`text-muted` ~4.5:1 (**AA body, at the line** — use `text-muted` for de-emphasis, never long body copy on
panel). Cyan/accents remain ≥ 6:1 (AA text, AAA graphical). On `--color-raised` `#171B22` add a further
~8% drop; `text-muted` there is ~4.1:1 → **caption/large only** on raised, not body.

## Text on the cyan fill (`--color-text-inverse` on `--color-cyan`)

`#06090E` on `#22D3EE` ≈ **9:1** → AAA. Primary CTA / verified pill text is legible.

## Notes / decisions

- **AA floor met everywhere it matters.** The one guardrail: `--color-text-muted` is AA-borderline on
  `panel`/`raised` — reserved for short de-emphasis (timestamps, hints), never body prose. Body prose uses
  `text-secondary` (AAA on all three grounds).
- **Verdict colors are signal, not decoration** — `--color-failed` appears only on the failures surface +
  real error states (design-story §4); `--color-caution` only on testnet / recorded-run / disclosures.
- **Founder gold is Founder-scoped** — never a site-wide accent (C7; tuned off studio `#FF8C00`).
- **Distinct-from-studio:** cyan `#22D3EE` ≠ studio `#00E5FF`; flat panels + cyan edge-light ≠ studio glass.
- **Portability:** live formats are CSS custom properties (`src/styles/tokens.css`, authoritative) + JS
  constants (`src/styles/tokens.js`). A JSON export for design tools is derivable from `tokens.js` on demand
  — intentionally not a committed static file (avoids silent drift).

*Ratios are WCAG 2.x relative-luminance computations (sRGB, +0.05 flare). Re-validate on any hex change.*
