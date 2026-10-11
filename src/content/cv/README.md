# John's CVs

Each file here is one CV, edited as HTML. The build turns it into a page and a PDF. No PDF is ever edited by hand.

| Source | Page | PDF |
|---|---|---|
| `ai-agentic-developer.html` | `/cv/ai-agentic-developer` | `/cv/John_Wellard_AI_Agentic_Developer_CV.pdf` |
| `blockchain-engineer.html` | `/cv/blockchain-engineer` | `/cv/John_Wellard_Blockchain_Engineer_CV.pdf` |
| `web3-pm.html` | `/cv/web3-pm` | `/cv/John_Wellard_Web3_PM_CV.pdf` |

`npm run build` runs `scripts/build-cv.mjs` after `vite build`. Each deploy of `v2` publishes what is here.

The script does three things:
- It replaces the Google Fonts link with the same families and weights, served from the site. The site's CSP blocks Google Fonts.
- It writes each page to `dist/cv/`.
- It renders each page to its PDF with Chromium, as A4 with the screen styles, as the job-search renderer did. The agentic CV prints at 0.9.

To see the result, run `npm run build && npm run preview`, then open `/cv/<page>`.

## What stops the build

The rules are in `src/lib/cvPages.js` and are tested in `src/lib/__tests__/cvPages.test.js`. The build stops on any of these:

- **Anything off the site:** a script, or a remote stylesheet, font, image or embed. Links to other sites are fine.
- **A bound figure the register doesn't state.** An element with `data-claim="<id>"` shows a figure from `src/data/evidence-register.json`.
  - The claim must be cleared.
  - Every number the element shows must be in the claim's value, in the same order.
  - If the register changes, the build stops until the CV matches it.
  - Bound now: the CodeHawks record (`codehawks-validated-findings`) and the GraphRAG figures (`graphrag-retriever-uplift`, `graphrag-chunks`, `graphrag-entities`).
  - Keep these attributes when you edit. A new figure that the register holds gets one too.
- **A phrase the register forbids,** anywhere in the text. This is the same list the claims gate enforces on every page.

`e2e/cv.spec.js` checks each page and its PDF on the production build, and again on the deployed site after every deploy. It checks that each page loads with its own fonts, has no console errors, doesn't scroll sideways on a phone, and serves a PDF.
