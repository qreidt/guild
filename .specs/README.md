# Guild Canonical Spec

Snapshot date: 2026-04-01

This directory is the canonical product and architecture spec for the current `guild` repository state. It describes what the prototype is trying to be, what is already implemented, what is only partially implemented, and which parts are still planned.

## Current status

- Product type: browser-based fantasy city management prototype
- Frontend stack: Vue 3 + TypeScript + Vite + Tailwind CSS v4
- Current playable surface: one-screen city dashboard with tick controls and a building sidebar
- Current simulation scope: city state, building workers, time-based actions, in-memory inventory accounts, and a starter item economy
- Implemented but not player-facing yet: adventurer domain model, equipment catalog, transaction-based inventory plumbing
- Not implemented yet: persistence, quests, recruitment, combat, expeditions, dungeon exploration, save/load
- Build status: `npm run build` currently fails because of TypeScript errors in the checked-out codebase

## Document map

- [product.md](./product.md): game vision, player fantasy, domain glossary, and scope boundaries
- [architecture.md](./architecture.md): technical architecture, runtime flow, state ownership, and known technical gaps
- [roadmap.md](./roadmap.md): planned product evolution derived from the README and design notes
- [features/city-simulation/README.md](./features/city-simulation/README.md): global game loop, city state, tick rules, and current simulation behavior
- [features/buildings-economy/README.md](./features/buildings-economy/README.md): buildings, workers, actions, goods, and inventory accounting
- [features/interface-controls/README.md](./features/interface-controls/README.md): current screen layout and player controls
- [features/adventurers-equipment/README.md](./features/adventurers-equipment/README.md): adventurer model, equipment rules, and gear definitions
- [features/world-expeditions/README.md](./features/world-expeditions/README.md): planned world, mission, monster, and zone systems

## Source of truth rules

- The checked-out repository state is the source of truth for implemented behavior.
- `README.md`, `_.md`, and `src/game/**/docs/*.md` are treated as intent and roadmap inputs when they do not match code.
- When intent and code differ, this spec records both:
  - implemented behavior
  - intended behavior
  - known implementation gaps

## Current implementation summary

- The app mounts a single `App.vue` screen.
- The screen exposes the city title, city money, citizen count, global tick number, pause/resume control, and single-step ticking.
- The left sidebar lists the current buildings:
  - Lumber Mill
  - Iron Mine
  - BlackSmith
- Selecting a building shows a raw `<pre>` dump of that building object.
- The simulation currently runs entirely in memory and resets on refresh.

## Current build blockers

The current branch does not type-check successfully. The main issues are:

- incorrect prop typing in `BuildingsList.vue`
- type mismatches in `Adventurer.ts` when reading weapon and armor properties from abstract base classes
- an invalid return type in `EquippableItem.ts`
- an incorrect default import of `City` in `Layout.vue`

These blockers do not prevent the spec from describing the intended prototype structure, but they do mean the repo is not currently in a clean releasable state.
