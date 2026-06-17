## Refined Request Brief

> Output of `refine-request` for [`request.md`](./request.md) (CQR-53). Resolves the
> critical review below into a hand-off for `spec-workflow-mcp`. Suggested
> spec-workflow spec name: **`read-only-environment-interfaces`**.

**Goal:** Give each environment a strictly read-only visual interface (active
workers + current task + progress, inventory, funds) plus a global city view,
proven via a vertical slice that renders one environment in 2D and one in 3D so a
direction can be chosen for full rollout.

**Scope:**

- **In:** render-agnostic reactive view-model; view container/registry replacing
  the `<pre>` dump; 1× 2D prototype (Blacksmith, SVG/CSS); 1× 3D prototype
  (city-global overview, Three.js/TresJS); 2D-vs-3D comparison + recommendation.
  Strictly read-only.
- **Out:** any state mutation (assigning workers, trading — Market keeps its
  existing controls); worker/Adventurer naming; persistence; rolling the chosen
  style out to the remaining environments (follow-up cycles).
- **This pass:** generate the spec only (Requirements → Design → Tasks via
  spec-workflow). **No implementation yet** — stop before Phase 4.

**Key Behaviors:**

- Glance at an environment → viewer states who's working + on what + progress, what
  is in stock, and funds — without reading code.
- Views refresh each tick via the `marketService` reactive-singleton pattern (engine
  and UI share one proxy).
- The "no active tab" state renders the global city overview (assigned to the 3D
  prototype in this slice).

**Acceptance Criteria:**

- [ ] From a glance, a viewer reports (a) workers + task + progress, (b) stock,
  (c) funds — no code-reading.
- [ ] One 2D (Blacksmith) and one 3D (city-global) prototype both read the *same*
  view-model.
- [ ] A written 2D-vs-3D recommendation (effort, feel, performance,
  maintainability) with enumerated rollout follow-ups.

**Spec Deltas:**

- Supersedes the "intended next UI milestone" in
  `.specs/features/interface-controls/README.md` — the `<pre>` dump is replaced by a
  designed view container.
- Builds on discovery experiment **X2** in
  `.specs/discovery-next-feature-2026-06-08.md` (thin read-only building detail
  panel), extending it with a render-agnostic layer + 3D comparison.
- **Correction to the source story:** the readable task label is the action
  **instance** `name` (`'Wait'`, `'Transport'`), *not* `static.name`. `Action`
  declares `static name = ''` (`src/game/city/buildings/common/Action.ts:25`), so
  the cited `active_action.static.name` path resolves to `''`. Read
  `active_action.name`.
- **New dependency:** the 3D arm introduces `three` + `@tresjs/core` (absent from
  `package.json` today).

**Notes (for the spec generator):**

- **Read-only data sources** (verified; no engine change):
  - building funds → `building.money`; city → `city.money`, `city.citizens_count`
    (header already binds these, `src/App.vue:7`).
  - workers → `building.workers[]` (`Worker[]`), anonymous → label by index
    ("Smith 1").
  - current task → `worker.active_action?.name` (see correction above).
  - progress → `1 - active_action.ticks_remaining / active_action.total_ticks`
    (0 at start → 1 done; `ticks_remaining` is `999` until `start()`).
  - inventory → `building.inventory.getCountByGoodId()` → `Map<ItemID, number>`
    (also cached on `building._data.inventory` each tick).
  - item names/values → `ItemRegistry[itemId]` (`src/modules/items/registry.ts`).
- The "5 environments" rollout targets = BlackSmith, IronMine, LumberMill, Market,
  + city-global. **Market is excluded** from the read-only treatment — it already
  has `MarketPanel.vue` with controls.
- Keep both prototypes thin. The 3D arm's dependency weight is a **steering point**:
  if the 2D Blacksmith prototype already feels right, cut the 3D arm before
  completing it rather than building it to full.
- **Size:** Large (shared layer + 2D + 3D + comparison).
