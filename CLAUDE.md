# Guild

A browser game — Vue 3 + TypeScript + Vite. A city simulation with buildings, workers,
inventory, and a market economy.

## Commands

- `npm run dev` — Vite dev server (port 5173, autoPort).
- `npm run build` — `vue-tsc -b && vite build`. For a quick full typecheck without the
  Vite build: `npx vue-tsc -b --force` (`-b` is incremental — pass `--force` to actually
  re-check after edits, otherwise it can no-op and print nothing).
- `npm run console` — runs `src/console.ts` via tsx; handy for exercising pure functions
  or module-load assertions outside the browser.

No automated test runner is configured — verify via the dev server and `vue-tsc`.

## Conventions

- TypeScript strict; no new `any`. Vue 3 `<script setup>` + Composition API; **no store
  library** — reactivity flows from `reactive(GameControllerSingleton)` and a
  `controller.tick` per-tick heartbeat.
- Framework-agnostic domain/presentation logic lives in `src/modules/`; Vue UI in
  `src/components/`; the game engine in `src/game/`.
- **3D city view** (`src/components/environment/views/`): `three` / `@tresjs/core` are
  imported **only** in the `.vue` mesh components, and `CityGlobalView3D.vue` is
  lazy-loaded so `three` stays out of the 2D / initial bundle. Keep it that way.
- The city backdrop is an **authored grid map** (`city/grid.ts` model + `city/town-layout.ts`
  data): `CELL = 3` world units, **one occupant per cell** enforced by `buildOccupancy()`
  at module load — a bad authored placement throws on load. New authored structures must
  be added as grid occupants. Full design lives under
  `.specs/.cycles/cqr-53-read-only-environment-interfaces/3d-city-grid/`.
- Map compass (a labeling convention only): N = −x, S = +x (sea), E = −z (farms),
  W = +z. The source-of-truth comment is at the top of `city/town-layout.ts`.

## Specs

Specs are canonical under `.specs/`. Active work is organized under
`.specs/.cycles/<cycle-id>/` with `request.md`, `requirements.md`, `plan.md`, `tasks.md`
(plus optional sub-feature subdirs). Keep them in sync with the code; when reconciling
after iterations, record **as-built deltas** (note deviations) rather than rewriting the
original brief.
