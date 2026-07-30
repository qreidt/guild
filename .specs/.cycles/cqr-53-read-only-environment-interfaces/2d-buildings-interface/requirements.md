# Requirements — 2D building interiors: vertical progress rows

> Sub-feature `2d-buildings-interface` of CQR-53. Companion to
> [`request.md`](./request.md), [`plan.md`](./plan.md), [`tasks.md`](./tasks.md).
> Refines the parent [R3](../requirements.md) 2D Blacksmith arm; **read-only**
> throughout (parent [R6](../requirements.md)). No view-model or engine change.
>
> **R1–R5** cover the Blacksmith refactor that validated the concept. **R6–R7** cover
> the rollout to the LumberMill and IronMine (shared shell + two new interiors).

## Introduction

The 2D Blacksmith art view
([`BlacksmithView2D.vue`](../../../../src/components/environment/views/BlacksmithView2D.vue))
draws each worker as an **animated SVG smith figure** (a `bs-strike` hammer swing)
laid **horizontally** across a fixed forge scene. The animation conveys nothing the
progress bar doesn't, and the horizontal layout diverges from every other building,
which uses
[`GenericEnvironmentView.vue`](../../../../src/components/environment/GenericEnvironmentView.vue)'s
**vertical** `label → task → progress bar` rows.

This sub-feature refactors the Blacksmith view to a calmer presentation: the smith
figures and per-worker animation are removed; workers become a **vertical** list of
simple progress rows beneath a retained **furnace backdrop** banner. It validates the
concept on the Blacksmith only — the other interiors are a later, separate pass.

## As-built delta to parent R3

Parent [`requirements.md`](../requirements.md) **R3** specs the 2D Blacksmith as an
"illustrated forge scene" with smith **figures** laid "across the scene" and a
**hammer-strike** animation (parent R3.1). This sub-feature **deliberately deviates**:
the figures and per-worker animation are removed in favour of a vertical
progress-row layout. Parent R3.2 (raw action identifiers), R3.3 (live updates), R3.4
(read-only, view-model-only), and R3.5 (5-second legibility) are **retained
unchanged**. Per `CLAUDE.md`, this is recorded as a delta — the parent brief is not
rewritten.

## Alignment

- Refines parent R3; honours parent R6 (strictly read-only) and the cycle NFRs
  (layer separation, single registry, reactivity, `three` isolation).
- Reuses the existing render-agnostic view-model — `WorkerView { label, task,
  progress, status }` and `InventoryRow`
  ([`types.ts`](../../../../src/modules/environment-view/types.ts)) — with **no**
  changes (parent R1 data layer unchanged).

## Requirements

### Requirement 1 — Vertical worker rows replace the smith figures

**User Story:** As a player, I want each Blacksmith worker shown as a simple labelled
progress row, so that I read who is working on what without character-art clutter.

#### Acceptance Criteria

1. WHEN the Blacksmith is selected THEN the system SHALL render each worker in
   `view.workers` as a row in a **vertical** top-to-bottom stack, in `view.workers`
   order.
2. Each worker row SHALL show the worker `label` (e.g. "Smith 1"), the **raw action
   identifier** from `worker.task` (e.g. `MakeIronSword`, `MakeIngot`, `WaitAction`) —
   **no** humanization (parent R3.2) — and a progress bar filled to `worker.progress`
   with a percent readout.
3. WHEN `worker.status === 'idle'` (null task / done action) THEN the row SHALL render
   an idle treatment (muted styling, an italic "idle" in place of the task, and a 0%
   bar) and SHALL NOT display a stale task label.
4. WHEN `worker.status === 'working'` THEN the row SHALL be visually distinct from an
   idle row (e.g. active bar colour / full-strength text).
5. The layout SHALL NOT assume exactly two workers: it SHALL render correctly for `0`,
   `1`, or `N` workers (the Blacksmith has 2, but the component must not hardcode the
   count or use fixed horizontal `cx` positions).
6. No smith **figure** SVG (head/torso/apron/arm/hammer/anvil) and no per-worker
   animation (`bs-strike`/`bs-arm`) SHALL remain in the component.

### Requirement 2 — Furnace backdrop banner with retained ambient motion

**User Story:** As a player, I want the Blacksmith to still feel like a forge, so that
the view is recognizable at a glance and distinct from the generic fallback.

#### Acceptance Criteria

1. WHEN the Blacksmith view renders THEN a **furnace/forge backdrop** SHALL appear as a
   themed banner **above** the worker rows (keeping the simple forge look — forge body,
   ember glow, fire).
2. The furnace fire SHALL keep a **subtle ambient flicker** (the existing `bs-fire`
   motion idiom); this is the only motion permitted in the view besides progress-bar
   fills.
3. WHEN the user prefers reduced motion (`prefers-reduced-motion: reduce`) THEN all
   ambient motion (flicker, and sparks if present) SHALL be disabled.
4. The backdrop SHALL be **decorative only** — it SHALL NOT encode per-worker state
   (worker state lives entirely in the rows of R1).

### Requirement 3 — Funds and inventory preserved

**User Story:** As a player, I want to still see the building's stock and money, so that
the refactor loses no information.

#### Acceptance Criteria

1. The building **funds** (`view.funds`) SHALL remain visible.
2. The building **inventory** (`view.inventory`) SHALL remain visible, listing each
   row's name and count (the existing shelf/chip treatment may be kept or restyled to
   fit the vertical layout); an empty inventory SHALL show an explicit empty state.
3. WHEN the game advances a tick THEN funds, inventory, and worker progress SHALL update
   live with no manual refresh.

### Requirement 4 — Read-only & view-model-only (cross-cutting)

**User Story:** As a maintainer, I want the refactor to stay strictly read-only, so that
presentation work cannot regress game state.

#### Acceptance Criteria

1. The component SHALL read **exclusively** from the `EnvironmentView` prop (no direct
   engine/controller/building access) and SHALL perform **no** state mutation (parent
   R6).
2. The component SHALL NOT import `three` / `@tresjs/core` (cycle NFR: `three` stays out
   of the 2D path).
3. The view-model (`src/modules/environment-view/`) and the registry
   ([`environment-registry.ts`](../../../../src/components/environment/environment-registry.ts))
   SHALL be unchanged — `BuildingID.BlackSmith` already maps to this component.

### Requirement 5 — Anvil sparks (optional, cut-able)

**User Story:** As a player, I want a touch of forge ambience, so that the view feels
alive — but not at the cost of legibility.

#### Acceptance Criteria

1. The view MAY add a small ambient **spark/ember** effect (e.g. near an anvil motif in
   the backdrop). IF added THEN it SHALL be ambient-only, encode no state, and be
   disabled under `prefers-reduced-motion` (R2.3).
2. IF time-constrained THEN this requirement MAY be **cut** with no impact on R1–R4.

## Rollout requirements (LumberMill + IronMine)

> Added after the Blacksmith concept was approved. This is the "later pass" R1–R5
> deferred; it **supersedes** the original NFR bullet forbidding a shared abstraction
> (see the NFR note below).

### Requirement 6 — Shared building-interior shell

**User Story:** As a maintainer, I want the validated Blacksmith layout extracted once,
so that each additional 2D interior is banner art plus a theme rather than a copy of the
whole panel.

#### Acceptance Criteria

1. The header/banner/worker-rows/inventory layout validated on the Blacksmith SHALL be
   extracted into a single shared component
   ([`BuildingInterior2D.vue`](../../../../src/components/environment/BuildingInterior2D.vue))
   consumed by every 2D interior.
2. The shell SHALL accept the `EnvironmentView`, an accent **theme**, a funds glyph, an
   empty-state message, and a **`banner` slot** for the building-specific art; it SHALL
   render the banner frame only when that slot is supplied.
3. Theme accent classes SHALL be full **literal** class strings (Tailwind cannot see
   dynamically composed class names).
4. The Blacksmith's rendered output SHALL be **unchanged** by the extraction, including
   its scoped banner animations.
5. The shell SHALL carry the status-driven idle rule from the as-built note (R1.3) so
   every interior inherits it, rather than each view re-implementing it.

### Requirement 7 — LumberMill and IronMine interiors

**User Story:** As a player, I want the lumber mill and iron mine to read like their own
places, so that every production building is legible at a glance, not a raw fallback.

#### Acceptance Criteria

1. WHEN the LumberMill is selected THEN it SHALL render a 2D interior via the shell with
   a **sawmill** banner (saw bench, blade, timber yard) and an **emerald** accent.
2. WHEN the IronMine is selected THEN it SHALL render a 2D interior via the shell with a
   **mine-shaft** banner (framed shaft mouth, pit lantern, ore cart on rails) and a
   **sky** accent.
3. Each SHALL keep exactly one ambient motion idiom plus optional particles, all
   disabled under `prefers-reduced-motion` (R2.2/R2.3 carried forward).
4. SVG `<defs>` ids SHALL be **prefixed per building** (`bs-` / `lm-` / `im-`) — SVG ids
   are document-global and are not scoped by Vue's `scoped` styles.
5. Both SHALL be registered in
   [`environment-registry.ts`](../../../../src/components/environment/environment-registry.ts);
   no view-model change is required (`WORKER_LABEL_PREFIX` already maps them to
   "Lumberjack" / "Miner").
6. Both buildings currently have **one** worker, exercising R1.5 (no assumption of two).
7. The Market SHALL remain excluded (keeps `MarketPanel.vue` and its controls).

## Non-Functional Requirements

- **Scope:** ~~single component refactor — `BlacksmithView2D.vue` only. No new module,
  no shared "building-interior" abstraction (that is a deliberate later pass). Keep the
  worker-row + backdrop markup cleanly **extractable** so a future generalization is
  low-churn, but do not extract it now.~~
  **Superseded by R6** — the concept was approved and the rollout arrived, so the markup
  was extracted into `BuildingInterior2D.vue` as the plan intended ("low-churn
  generalization"). The parent NFR "reuse over reinvention" applies.
- **Code quality:** TypeScript strict, **no new `any`**; Vue 3 `<script setup>`;
  Tailwind utility classes consistent with the existing component.
- **Performance:** no per-frame work beyond Vue's tick-driven re-render plus the CSS
  flicker/sparks; the SVG backdrop SHALL be cheap.
- **Reliability:** progress SHALL always render in `[0,1]` (the view-model already
  clamps; the component SHALL NOT reintroduce un-clamped math). A null/idle task SHALL
  never render `NaN` or a negative bar.
- **Build:** `npx vue-tsc -b --force` SHALL pass with no new errors.
