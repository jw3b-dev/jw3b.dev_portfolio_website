# Role ledger — jw3b.dev v2 build (role-first hard rule)

**Invariant:** every build task is done *in role* — its role Skill was loaded BEFORE any
file was touched. No row may be `n`. Verify:

```bash
# match only a SKILL-LOADED table cell equal to n (pipe, spaces, n, spaces, pipe)
grep -nE '^\| .*\| +n +\|' mas/ROLE_LEDGER.md && echo "VIOLATION: task(s) not done in-role" || echo "OK: all tasks in-role"
```

Legend — SKILL-LOADED: `y` = role skill loaded this session before the work ·
`prior` = completed in the pre-compaction session with its role per the MAS log ·
`n` = NOT loaded → must be redone with the skill loaded.
"Role (actual)" names the closest-fit skill when the PLAN role has no skill of that name.

| TASK  | PLAN role | Role (actual) | SKILL-LOADED | COMMIT |
|-------|-----------|---------------|--------------|--------|
| P0-01 | lead-architect | lead-architect | prior | (prior session) |
| P0-02 | art-director | art-director | prior | cb1667c |
| P0-03 | brand-architect | brand-architect | prior | 4ddad49 |
| P0-04 | domain-engine | domain-engine | prior | e971a6a |
| P0-05 | backend-specialist | backend-specialist | prior | c3ba300 |
| P0-06 | backend-specialist | backend-specialist | prior | c3ba300 |
| P0-07 | domain-engine | domain-engine | prior | e971a6a |
| P0-08 | portfolio-evidence | compliance-officer (no such skill) | y | 59e25aa |
| P0-09 | full-stack-integrator | frontend-engineer (no such skill) | y | ad23ad9, 2364d2a |
| P0-10 | domain-engine | domain-engine | y | 646796c, 2364d2a |
| P0-11 | lead-architect | lead-architect | y | 7e610ce, 2364d2a |
| P0-12 | devops-engineer | security (no such skill) | y | 69a44d1 |
| P1-09 | frontend-engineer | frontend-engineer | y | 2364d2a |
| P1-01 | backend-specialist | backend-specialist | y | 57cc24c |
| P1-02 | backend-specialist | backend-specialist | y | 66d59ac |
| P1-03 | domain-engine | domain-engine | y | 14651bb |
| P1-05 | audit-heuristics-engineer | domain-engine (no such skill) | y | ad81ff3 |
| P1-04 | backend-specialist | backend-specialist | y | cc5d236 |
| P1-06 | backend-specialist | backend-specialist | y | 2bb633e |
| P1-07 | full-stack-integrator | frontend-engineer (no such skill) | y | 289560f |
| P1-08 | full-stack-integrator | frontend-engineer (no such skill) | y | cafd28e |
| P1-18a | domain-engine | domain-engine | y | 2bb633e (retainer.json catalog seed; loadout logic pending in P1-18) |
| P1-10 | frontend-engineer | frontend-engineer | y | 884e576 |
