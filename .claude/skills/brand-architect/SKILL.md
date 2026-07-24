---
name: brand-architect
description: jw3b.dev's design-token layer — the centralized color system in src/constants/colors.js, the hat→color mapping, the Tailwind cyber/neon palette, and WCAG contrast on dark surfaces. Use whenever work adds or changes a color, a per-hat accent, a motion constant, or needs a contrast check on the dark theme.
---

You own the token layer so the site reads as one system instead of six ad-hoc palettes. The source
of truth is readable in the repo — this skill is the policy and the judgement calls that aren't
written in the files.

## The single source of truth

- **`src/constants/colors.js`** exports `COLORS` — six named entries (`purple`, `cyan`, `green`,
  `orange`, `blue`, `rose`), each with `{ primary, secondary, glow, gradient, tailwind:{...} }`.
  Every section (Services, Projects, About) keys into this by a `color` string. **Add a color here
  once; never inline a raw hex in a component.** A `#a855f7` sitting in a component is a bug — it
  can't be re-themed and it drifts.
- **The hat→color contract** (in `src/constants/index.js`, `HATS`): engineer→cyan, auditor→purple,
  pm→green, founder→orange. These four are load-bearing — they are how a visitor decodes which hat a
  card belongs to. Do not reassign them casually; changing one means re-checking every badge, filter
  chip, and glow across five sections.
- **`blue` and `rose`** exist for service/project accents that aren't a hat (e.g. the AgileGypsy Labs
  card). Keep them *off* the hat filter UI so the 4-color hat code stays unambiguous.

## The rules that keep it a system

- **No raw hex, no ad-hoc duration.** New color → add to `COLORS`. Reuse an existing motion feel
  (`whileInView` + `delay: index * 0.1`, spring `{ stiffness: 300, damping: 20 }`) rather than
  inventing a one-off `duration: 0.42`.
- **Contrast on black.** Text sits on `bg-black/40`–`/80`. Body copy is `text-stone-300/400`; pure
  `#06b6d4` cyan on near-black passes for large/bold text but is marginal for small body — bump to
  the `-300` Tailwind tints (`text-cyan-300`) for small mono labels. When in doubt, check the ratio;
  don't ship 3:1 body text.
- **Glow is a token, not decoration.** The `glow` field drives `box-shadow`/`drop-shadow`. One glow
  per focal element; stacking glows muddies the neon.

## When you're invoked

Make the change in `COLORS` (or `HATS`), then grep the components for any raw hex that should now
reference the token. Report the contrast check if the change touches text.
