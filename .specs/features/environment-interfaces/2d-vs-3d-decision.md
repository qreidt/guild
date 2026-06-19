# Environment Art Direction — 2D vs 3D Decision

> Canonical current-state doc. Outcome of cycle **CQR-53**
> ([read-only-environment-interfaces](../../.cycles/cqr-53-read-only-environment-interfaces/)).
> Both art arms were built and measured; this records the comparison and the chosen
> direction for rollout.

## Context — what was built

A single render-agnostic view-model (`src/modules/environment-view/`) maps live engine
state into plain DTOs (`EnvironmentView`, `CityView`). One Vue composable
(`useEnvironmentView` / `useCityView`) makes it reactive via a per-tick heartbeat. A
container (`EnvironmentView.vue`) replaced the `<pre>{{ activeBuilding }}</pre>` dump and
dispatches by registry to one of three consumers of that **same** view-model:

- **2D arm** — `BlacksmithView2D.vue`: an illustrated SVG/CSS forge interior. Two smith
  figures (Smith 1 / Smith 2) with raw task labels, progress bars, an inventory shelf,
  and a funds plaque. Animated (forge flicker, hammer strike on working smiths).
- **3D arm** — `CityGlobalView3D.vue`: a Three.js/TresJS ambient backdrop for the
  no-active-tab state. One box per building, a ground plane, lights, and an HTML
  money/citizens overlay.
- **Generic fallback** — `GenericEnvironmentView.vue`: plain-HTML table view (IronMine,
  LumberMill today). Proves the view-model is genuinely render-agnostic — a third
  consumer with zero art.

That three renderers consume one unchanged view-model is the central result: **the data
layer is shared; only the art differs.** The 2D-vs-3D question is therefore a real
art-direction choice, not two unrelated screens.

## Comparison

All figures are measured from the production build (`vite build`) and the running dev
server, not estimated.

| Axis | 2D (SVG/CSS — Blacksmith) | 3D (Three.js/TresJS — city-global) |
|---|---|---|
| **Effort** | Low. Pure Vue template + inline SVG + a little scoped CSS. No new deps, no config. One file (~190 lines). | Medium. Two runtime deps (`three`, `@tresjs/core`) + `@types/three`; a `vite.config` `isCustomElement` rule; learning the `<Tres*>` element mapping. Component itself is small (~75 lines). |
| **Feel** | Reads as the *place* — a forge with smiths actually hammering. Data sits on the art (labels, bars, chips). Passes the 5-second legibility check: who / what / progress / stock / funds, all at a glance. | Atmospheric but abstract — coloured boxes, not a city. Good as ambient background; carries city money/citizens fine, but conveys little per-building meaning at this fidelity. Real depth would need real assets (models, textures), which multiplies effort. |
| **Performance** | Negligible. Re-renders only on Vue's tick-driven invalidation; no per-frame loop. Chunk: **6.2 kB (2.4 kB gzip)**. | A continuous WebGL render loop. Smooth for a handful of boxes, but the chunk is **852 kB (231 kB gzip)** — ~**100× heavier** than the 2D arm. Isolated in a lazy chunk, so it never touches the 2D / initial bundle (initial bundle stays **99 kB**). |
| **Maintainability** | Any web dev can edit it — it's HTML/SVG/CSS. No domain knowledge of a 3D engine. Diffs are readable. | Requires Three.js/TresJS familiarity. Coordinates, cameras, lights, and the custom-element compiler rule are extra surface area to keep working across `three` upgrades (which move fast and break often). |

### Notes captured during the build

- **Bundle isolation works as designed.** The lazy `defineAsyncComponent` import keeps
  `three` entirely inside the `CityGlobalView3D` chunk. The 2D path (`index` +
  `BlacksmithView2D` chunks) contains zero Three.js. `vite.config`'s `isCustomElement`
  rule was inlined rather than imported from `@tresjs/core`, so the build itself stays
  decoupled from the 3D deps.
- **Reactivity was the #1 risk and is solved.** The heartbeat (`void controller.tick` in
  a `computed`, building resolved fresh from the reactive `buildings` map) drives live
  updates without deep-reactive propagation through nested building state. Verified live:
  worker progress `0→50→…`, inventory `IronOre 400→396→394`, `IronIngot 0→2→0` as the
  Blacksmith produces and consumes.
- **`CityView` is static during normal play.** `city.money` / `city.citizens_count` don't
  change on a tick today (only building- and market-level money moves), so the 3D
  overlay rarely animates. The 3D arm's dynamism is therefore mostly the (fixed) scene
  itself — another reason its weight is hard to justify versus the per-building 2D view.

## Recommendation

**Adopt 2D (illustrated SVG/CSS scenes) as Guild's environment art direction.**

For per-environment interiors it wins on every axis that matters here: ~100× lighter,
zero dependencies, trivially maintainable, and already proven legible and live. The 3D
arm earned its keep as a *spike* — it validated that the view-model is truly
render-agnostic and that `three` can be added without polluting the 2D/initial bundle —
but ~231 kB gzip and a WebGL engine is a steep price for an ambient box scene.

For the **city-global** (no-active-tab) backdrop specifically, the 3D scene **may stay**
as-is for now: it's fully isolated and lazy, so it costs nothing until that state
renders. It is **not** the recommended direction for the building interiors, and the
rollout should decide whether to keep it or replace it with a 2D establishing scene (see
follow-ups) so Guild can drop the `three` dependency entirely.

## Rollout follow-ups

One cycle each, in the chosen 2D style. **Market is excluded** (it already has
`MarketPanel.vue` with controls); **Blacksmith is done** by this slice.

1. **IronMine 2D interior** — Miner figure(s), raw task (`MineOres` / `SellOres`), ore
   stock, funds. IronMine has 1 active worker today (second is commented out).
2. **LumberMill 2D interior** — Lumberjack figure(s), raw task (`TakeDownTree` /
   `MakeWood` / `SellWood`), lumber/plank stock, funds.
3. **City-global art decision** — keep the lazy 3D backdrop, or rebuild it as a 2D
   illustrated establishing scene to remove `three`/`@tresjs/core`. Include a
   **deselect affordance** in `BuildingsList` so the no-tab state is reachable after a
   selection (today it only shows on first load).

### Cross-cutting enhancements (not blockers, surfaced by this slice)

- **Label humanization.** Task labels are raw identifiers (`MakeIronGauntlet`). A small
  formatter or `ActionID → label` map is an easy later pass; the view-model already
  centralises the label in `resolveTaskLabel`.
- **Working vs. night-stalled.** Mine/mill actions freeze at night (`shouldTick() →
  !isNight()`) while still "active". The view-model reports `working`/`idle` only;
  distinguishing a *stalled* worker is a future `WorkerStatus` addition (Blacksmith has
  no night guard, so it doesn't need it).

## Supersedes

This supersedes the "Intended next UI milestone" in
[`../interface-controls/README.md`](../interface-controls/README.md) — the `<pre>` dump is
now a designed, reactive environment view. That milestone also listed *recipe thresholds /
current production choice*, which remains **deferred** (out of scope for this read-only
slice). Builds on discovery experiment **X2**
([`../../discovery-next-feature-2026-06-08.md`](../../discovery-next-feature-2026-06-08.md)),
extending it with a render-agnostic view-model and this art-direction comparison.
