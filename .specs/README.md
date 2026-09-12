# Guild canonical spec

Snapshot date: 2026-09-12. First snapshot: 2026-04-06.

This directory is the canonical product and architecture spec for the current `guild` repository state. It describes what the prototype is trying to be, what is already implemented, what is only partially implemented, and which parts are still planned.

## Current status

- Product type: browser-based fantasy city management prototype
- Frontend stack: Vue 3 + TypeScript + Vite + Tailwind CSS v4. Three.js and TresJS load in one lazy chunk, for the 3D city view only
- Playable surface: a city screen with a 3D city backdrop, a 2D interior per production building, a Market panel with controls, an adventurer roster, and tick controls
- Simulation scope: city state, six buildings with workers and time-based actions, in-memory inventory accounts, a Market that buys, sells and exports at catalog prices, a quest board with rewards paid up front, and one adventurer
- Buildings: Lumber Mill, Iron Mine, BlackSmith, Apothecary, Adventurers' Guild, Market
- Quests: the board, posting and settlement rules ship (CQR-60), and one adventurer claims, forages and delivers against it (CQR-61). Gather is the only objective kind
- Adventurers: one Scout is seeded at startup, with a roster screen of their own. Recruitment, parties, combat, rank progression, equipping and wages are all later work
- Randomness: one seeded stream per actor, pinned with the console `seed` command (ADR 0005)
- Headless harness: `npm run console` drives the same simulation from a terminal
- Implemented but not player-facing yet: equipment catalog, transaction-based inventory plumbing
- Not implemented yet: persistence, recruitment, combat, expeditions, dungeon exploration, save/load
- Build status: `npm run build` passes as of 2026-09-12. The lazy 3D chunk is 887 kB minified and trips Vite's chunk-size warning

## Document map

- [product.md](./product.md): game vision, player fantasy, domain glossary, and scope boundaries
- [architecture.md](./architecture.md): technical architecture, runtime flow, state ownership, and known technical gaps
- [roadmap.md](./roadmap.md): planned product evolution derived from the README and design notes
- [.cycles/README.md](./.cycles/README.md): the index of work cycles, one folder per Linear issue, each with its request, requirements, plan and tasks
- [apothecary-herb-catalog.md](./apothecary-herb-catalog.md): the foraged-herb and potion catalog that CQR-59 turned into items
- [features/city-simulation/README.md](./features/city-simulation/README.md): global game loop, city state, tick rules, and current simulation behavior
- [features/buildings-economy/README.md](./features/buildings-economy/README.md): buildings, workers, actions, goods, and inventory accounting
- [features/city-market/README.md](./features/city-market/README.md): the Market building, its sell, buy and export flows, and the Market panel
- [features/interface-controls/README.md](./features/interface-controls/README.md): current screen layout and player controls
- [features/environment-interfaces/2d-vs-3d-decision.md](./features/environment-interfaces/2d-vs-3d-decision.md): the measured 2D-vs-3D comparison from CQR-53 and the chosen art direction
- [features/adventurers-equipment/README.md](./features/adventurers-equipment/README.md): adventurer model, equipment rules, and gear definitions
- [features/world-expeditions/README.md](./features/world-expeditions/README.md): planned world, mission, monster, and zone systems
- [features/console-harness/README.md](./features/console-harness/README.md): the headless `npm run console` entrypoint for driving and inspecting the simulation from a terminal
- [review-2026-04-03.md](./review-2026-04-03.md) and [discovery-next-feature-2026-06-08.md](./discovery-next-feature-2026-06-08.md): dated working notes, kept for history
- Architecture decision records live outside this folder, in [../docs/adr/](../docs/adr/)

## Source of truth rules

- The checked-out repository state is the source of truth for implemented behavior.
- `README.md`, `_.md`, and `src/game/**/docs/*.md` are treated as intent and roadmap inputs when they do not match code.
- When intent and code differ, this spec records both:
  - implemented behavior
  - intended behavior
  - known implementation gaps

## Current implementation summary

- The app mounts a single `App.vue` screen inside a fixed header, a left sidebar, the main area and a fixed footer.
- The header shows the city title, city money and citizen count. Clicking the title returns to the city view.
- The left sidebar lists the six buildings under "Buildings" and the adventurer roster under "People".
- With no building selected, the main area renders the 3D city view: an authored grid map with walls, roads, houses and one mesh per building.
- Selecting a production building renders its 2D interior: a themed banner, one progress row per worker, the inventory shelf and the funds. The Adventurers' Guild shows its quest board instead.
- Selecting the Market renders the Market panel: stock with unit prices, recent trades and an export-all control. This is the only screen with controls beyond the clock.
- Selecting "Adventurers" renders the roster: each adventurer's class, location, current action, progress, claimed quest and carried goods.
- The footer shows the tick number, a Pause or Resume button and a Next Tick button.
- The simulation runs entirely in memory and resets on refresh.

## Items and inventory refactor (PR #1)

The following structural changes were introduced in the inventory and items refactor:

- All item definitions moved from `src/game/` to a dedicated `src/modules/items/` module.
- A proper class hierarchy is now in place: `Item` → `ItemInstance` → `EquippableItem` → `Weapon` / `Armor`.
- `ItemID` enum and `ItemRegistry` provide a single lookup map from ID to class constructor.
- `City.inventory` migrated from the legacy `Inventory` class to `InventoryAccountService`.
- `Adventurer.inventory` migrated from the legacy `Inventory` class to `InventoryAccountService` keyed as `adventurer:{id}`.
- TypeScript build errors from `review-2026-04-03.md` are resolved; `npm run build` now passes.
