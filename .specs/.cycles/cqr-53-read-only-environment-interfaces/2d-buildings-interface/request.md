# Request: 2D Blacksmith interior — strip worker animation, vertical progress rows

|                  |                                                                                                                              |
|------------------|------------------------------------------------------------------------------------------------------------------------------|
| **Parent cycle** | [`cqr-53-read-only-environment-interfaces`](../request.md) (Linear [CQR-53](https://linear.app/cqr/issue/CQR-53))            |
| **Sub-feature**  | `2d-buildings-interface` (validated on the Blacksmith first)                                                                 |
| **Branch**       | `feat/interface`                                                                                                             |
| **Captured**     | 2026-06-22                                                                                                                   |
| **User framing** | The worker animation is unnecessary. Replace it with simple vertical progress rows. Keep the furnace look; sparks are extra. |

> Raw request captured for the refine → spec-workflow pipeline. The refined brief
> (with conflicts/as-built deltas) lives in the second half of this file.

---

## Why

The 2D Blacksmith art view ([`BlacksmithView2D.vue`](../../../../src/components/environment/views/BlacksmithView2D.vue))
currently draws each worker as an **animated SVG smith figure** (a `bs-strike`
hammer swing) laid out **horizontally** across a fixed forge scene. The character
animation adds visual noise without conveying information the progress bar doesn't
already carry. Every other building falls back to
[`GenericEnvironmentView.vue`](../../../../src/components/environment/GenericEnvironmentView.vue),
which already presents workers as a clean **vertical** stack of `label → task →
progress bar` rows. The Blacksmith should converge on that calmer, more legible
presentation while keeping a building-specific themed backdrop.

## Goal

Refactor the 2D Blacksmith view so each worker is a **simple vertical progress row**
(no character art, no per-worker animation), sitting beneath a retained **furnace
backdrop**. Validate the concept here before generalizing it to the other building
interiors.

## Scope

**In scope (Blacksmith only):**
- Remove the per-worker smith **figures** and the `bs-strike` hammer animation entirely.
- Present the building's **2 workers** ("Smith 1" / "Smith 2") as a **vertical** list of
  rows, each: index label + **raw action identifier** + a simple progress bar (and
  percent). Idle workers read as such.
- Keep a **furnace/forge backdrop** as a themed banner **above** the worker rows.
  Ambient furnace motion (the gentle fire flicker) stays; `prefers-reduced-motion` is
  still honoured.
- Inventory and funds continue to render (unchanged data, may be restyled to fit the
  new vertical layout).
- Strictly **read-only**; reads exclusively from the shared view-model.

**Out of scope / non-goals:**
- Generalizing the pattern to IronMine / LumberMill / others. We validate on the
  Blacksmith first; the other interiors are customized in a **later** pass once the
  concept is approved. Keep the layout cleanly extractable, but do **not** build a
  formal shared "building-interior" abstraction in this pass.
- Any view-model / engine change. `WorkerView { label, task, progress, status }`
  already supplies everything
  ([`types.ts`](../../../../src/modules/environment-view/types.ts)).
- Humanizing action labels (still raw identifiers — see Conflicts).
- Any state mutation, new interaction, or worker naming.

## Optional (nice-to-have, not required)
- **Anvil sparks** — a small ambient spark/ember effect near the furnace or an anvil
  motif in the backdrop. Ambient only; must respect `prefers-reduced-motion`. Cut
  freely if it costs time.

## Data already available (no engine changes)
- Workers/tasks/progress → `view.workers[]` (`WorkerView`), already clamped to `0..1`.
- Inventory → `view.inventory[]` (`InventoryRow`).
- Funds → `view.funds`.

---

## Refined Request Brief: 2D Blacksmith interior refactor

**Goal:** Replace the animated horizontal smith figures with a vertical list of
simple per-worker progress rows under a retained furnace backdrop.

**Task size:** **Small** — one component (`BlacksmithView2D.vue`), no view-model or
engine changes, single art area.

**Scope in:** Worker presentation (vertical rows, no figures/animation), furnace
backdrop banner above the rows, ambient furnace motion retained, inventory + funds
preserved. Read-only.

**Scope out:** Other buildings, view-model changes, action-label humanization, new
interactions, worker naming, sparks (optional only).

**Key behaviors:**
- **Worker rows (working):** show `label`, the raw action identifier (e.g.
  `MakeIronSword`, `MakeIngot`), and a progress bar filled to `progress` with a
  percent readout / updates live each tick.
- **Worker rows (idle):** `status === 'idle'` → render an "idle" treatment (e.g. muted
  row, empty/0% bar, italic "idle" in place of a task). Never show a stale task.
- **Ordering & count:** rows render in `view.workers` order; layout must not assume
  exactly 2 (degrade gracefully for 0, 1, or N) even though the Blacksmith has 2.
- **Furnace backdrop:** static forge art with a subtle fire flicker; disabled under
  `prefers-reduced-motion`. No worker figure or hammer animation anywhere.
- **No data → graceful empty state** (existing `v-else` "No blacksmith data." path).

**Data flow:**
- Input: `EnvironmentView` from the shared view-model (`useEnvironmentView`), per-tick
  reactive. No direct engine reads.
- Output: rendered SVG/CSS only. No writes.

**Acceptance criteria:**
- [ ] No smith character figure and no `bs-strike` (or any per-worker) animation remain
      in `BlacksmithView2D.vue`.
- [ ] Workers render as a **vertical** stack of rows (label + raw action + progress
      bar + percent), top-to-bottom, consistent with the generic view's vertical idiom.
- [ ] A furnace/forge backdrop renders as a banner **above** the worker rows; its fire
      keeps a subtle flicker that is removed under `prefers-reduced-motion`.
- [ ] Working vs idle workers are visually distinguishable; progress and inventory
      update live on tick.
- [ ] Funds and inventory remain visible and correct.
- [ ] View reads exclusively from the view-model and performs no mutation (read-only).
- [ ] `npx vue-tsc -b --force` passes; no new `any`; `three` stays out of this path.
- [ ] 5-second legibility check still holds: who's working + on what + progress, stock,
      funds — at a glance.

**Constraints:**
- TS strict, no new `any`; Vue 3 `<script setup>`; Tailwind utility classes as in the
  existing component.
- 2D arm must not import `three` / `@tresjs/core`.
- Reactivity via the existing tick-driven view-model; no per-frame work beyond Vue's
  re-render plus the CSS flicker.

**Dependencies:** None new. Relies on the existing view-model
(`src/modules/environment-view/`) and registry wiring
([`environment-registry.ts`](../../../../src/components/environment/environment-registry.ts),
already maps `BuildingID.BlackSmith → BlacksmithView2D.vue`).

---

## Conflicts & as-built deltas (please reconcile, don't silently diverge)

1. **Amends cycle Requirement 3 / `tasks.md`.** The parent
   [`requirements.md`](../requirements.md) R3 and the cycle `tasks.md` describe the 2D
   Blacksmith as an "illustrated forge scene" with **smith figures** laid "across the
   scene" and a **hammer-strike animation**. This request **deliberately removes** the
   figures and animation and switches to a vertical progress-row layout. Per
   `CLAUDE.md`, record this as an **as-built delta** on R3 (note the deviation) rather
   than rewriting the original brief.

2. **Blacksmith view converges toward the generic fallback.** With figures gone, the
   custom Blacksmith view differs from
   [`GenericEnvironmentView.vue`](../../../../src/components/environment/GenericEnvironmentView.vue)
   mainly by its **furnace backdrop** (and optional sparks). That is the intended
   differentiator — keep the backdrop meaningful so the custom view earns its place;
   otherwise the registry entry adds little over the generic view.

3. **Action labels stay raw.** Parent R3.2 mandates the **raw action identifier** (no
   humanization). This request keeps that — the vertical rows show `MakeIronSword` etc.
   verbatim. Flagging so the simpler layout isn't mistaken as license to prettify
   labels (that remains a separate, out-of-scope decision).

4. **"Remove animations" is scoped to workers.** Ambient furnace motion (fire flicker)
   and the optional anvil sparks are explicitly **allowed**; only the per-worker
   figure/hammer animation is removed. `prefers-reduced-motion` continues to disable all
   ambient motion.

5. **Sub-feature is broader than this pass.** The dir is named `2d-buildings-interface`
   but this request validates the concept **on the Blacksmith only**. The other
   interiors are a deliberate future pass — don't let the plural name pull IronMine /
   LumberMill into this scope.

## Notes for spec writer
- This is a single-component refactor; a lightweight spec is sufficient. Anchor the
  as-built delta against parent R3 in `requirements.md` and the relevant `tasks.md`
  row rather than authoring a parallel requirement set.
- Keep the worker-row markup structurally close to the generic view's vertical idiom so
  the eventual "customize for other buildings" pass can lift a shared row/backdrop
  shape with minimal churn (extractable, not yet extracted).
- Verify live tick updates after the rewrite (the cycle's #1 feasibility item) — the
  flicker is decorative, but progress fill and inventory must still update each tick.
