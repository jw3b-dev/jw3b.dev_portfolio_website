# Owner-supplied provisioning & evidence assets (jw3b.dev v2)

Assets John supplies for the build. Consumed by the relevant P0–P3 tasks. Add to this file as more arrives.

## Neo4j GraphAcademy credential URLs (supplied 2026-08-16) — evidence for CR-10 + the Neo4j certs
John's verifiable Neo4j GraphAcademy credentials (resolve CR-10 "Neo4j Certified Professional" and the
CV's Neo4j cert cluster — *Neo4j Certified Professional · Neo4j & GenAI · Neo4j MCP · Neo4j GDS*):

1. https://graphacademy.neo4j.com/c/f375dd5d-ce9a-4688-98b1-f5a765e07117
2. https://graphacademy.neo4j.com/c/1b9f3905-0d1e-455a-bd35-06c32e0e2128
3. https://graphacademy.neo4j.com/c/adfa7ccd-a347-4c09-8e62-0b236af41216
4. https://graphacademy.neo4j.com/c/d306fc2c-5687-4d58-a821-33b0c10c7b33
5. https://graphacademy.neo4j.com/c/b2cf5245-74e2-4864-a9b0-e16e27701262
6. https://graphacademy.neo4j.com/c/e235aec4-a1e6-4bab-ad1b-2777f199d60c

**For P0-08 (portfolio-evidence role):** fetch/verify each URL, read the credential title it certifies, and
**map each to the Neo4j claim it actually proves.** Attach as the `evidence_pointer` on the corresponding
`Credential`/`ClaimRecord` entries. Represent each **accurately** — if a URL is a *course completion* rather
than the formal "Certified Professional" *exam* credential, label it as such (proof-not-promises; do not
inflate a course badge into an exam cert). CR-10 clears once its matching credential URL is attached.

## Still owed by John (feature-flagged until supplied — book-a-call floor decouples launch)
- **Unlock Protocol lock addresses** (replace `0x…` placeholders) — task P2-05.
- **MilestoneEscrow deployment + funding posture** (Base) — task P2-04 / activation P3-02.
- **Book-a-call scheduler endpoint** (the real booking backend) — Mission Control book-a-call rail.
- **KTHULHU embed/framing access** (for the live flagship surface) — task P2-10.
