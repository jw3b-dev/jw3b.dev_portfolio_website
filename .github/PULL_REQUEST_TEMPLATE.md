## What this changes

<!-- One or two sentences. What is different after this merges, and why? -->

## Why

<!-- The reasoning or the bug it fixes. Link an issue if there is one. -->

## Verification

<!-- How do you know it works? Test names, a command run, a screenshot, a live URL. -->

## Checklist

- [ ] The gate is green locally:
      `npm run lint && npm test && npm run build && npm run claims-gate && npm run secret-scan`
- [ ] No raw hex colours — semantic design tokens only
- [ ] No new numeric or credential claim rendered without an evidence pointer in the register
- [ ] No secrets outside Worker secret storage
- [ ] Any new on-chain write simulates first, and any new live surface degrades honestly
