# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring
the codebase.

This is a **single-context** repo: one `CONTEXT.md` and one `docs/adr/` at the root.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary / ubiquitous language.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't
suggest creating them upfront. The `/domain-modeling` skill (reached via
`/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or
decisions actually get resolved.

Neither file exists yet — that's expected.

## File structure

```
/
├── CONTEXT.md
├── docs/
│   ├── adr/
│   │   ├── 0001-....md
│   │   └── 0002-....md
│   └── agents/          ← this directory: skill configuration
└── src/
```

If this repo ever splits into genuinely separate contexts, the layout becomes a root
`CONTEXT-MAP.md` pointing at one `CONTEXT.md` per context, with context-scoped
`src/<context>/docs/adr/`. It isn't there today — don't anticipate it.

## Relationship to `.specs/`

`docs/` and `.specs/` answer different questions and neither replaces the other:

- **`CONTEXT.md` + `docs/adr/`** — durable vocabulary and decisions. What a *Worker* is,
  why the city backdrop is an authored grid rather than procedural.
- **`.specs/`** — feature specs and cycle work (`request.md`, `requirements.md`,
  `plan.md`, `tasks.md` under `.specs/.cycles/<cycle-id>/`). What is being built now.

When a cycle settles a term or makes a decision with a life beyond that cycle, promote it
into `CONTEXT.md` or an ADR. `CLAUDE.md` already carries several such decisions inline
(the grid map, the inland-rectangle town, the map compass) — treat those as authoritative
until they're moved into proper ADRs.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a
hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms
the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're
inventing language the project doesn't use (reconsider) or there's a real gap (note it for
`/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently
overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
