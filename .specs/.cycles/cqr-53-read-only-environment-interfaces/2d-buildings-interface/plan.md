# Plan — 2D Blacksmith interior: vertical progress rows

> Companion to [`requirements.md`](./requirements.md) (R1–R5) and
> [`request.md`](./request.md). Sub-feature `2d-buildings-interface` of CQR-53 —
> refines the parent [R3](../requirements.md) 2D arm. Read-only (parent R6) throughout.

## Overview

A **single-component refactor** of
[`BlacksmithView2D.vue`](../../../../src/components/environment/views/BlacksmithView2D.vue).
The animated horizontal smith **figures** are deleted and replaced with a **vertical
stack of HTML/CSS progress rows** (the same idiom
[`GenericEnvironmentView.vue`](../../../../src/components/environment/GenericEnvironmentView.vue)
already uses), placed **beneath** a slimmed-down **furnace backdrop banner** kept in
SVG. Funds and inventory are preserved. No view-model, registry, or engine change —
the component keeps consuming the same `EnvironmentView` prop.

The view becomes ~half SVG (a decorative forge banner that keeps the `bs-fire`
flicker) and ~half HTML (the data rows + inventory), instead of an all-SVG scene whose
geometry encoded worker positions.

## What is removed vs kept vs added

**Removed**
- The `smiths` computed's **horizontal layout** math (`startX`, `gap`, per-smith
  `cx`) — rows no longer need x-coordinates.
- The per-smith **figure** SVG group (`translate(s.cx,130)`: head, apron, the
  `bs-arm`/hammer group) and the per-smith **anvil** group.
- The `.bs-arm` / `@keyframes bs-strike` hammer animation and the figure-targeting
  `g:not(.bs-idle) > g .bs-arm` rule.
- The in-SVG smith **plaque/text/progress** drawn per `cx` (those move to HTML rows).
- The wall-grid lines / floor framing that only existed to stage the figures (keep the
  forge itself).

**Kept**
- The forge art: `bs-wall` / `bs-fire` / `bs-glow` gradients, the forge body + ember
  glow + fire paths, and the **`bs-fire` flicker** animation (R2.2).
- `prefers-reduced-motion` guard (R2.3).
- The title + funds header and the inventory shelf (chips), restyled only as needed.
- The `v-else` "No blacksmith data." empty state.
- `pct()` helper.

**Added**
- A compact **furnace backdrop banner** (small fixed-height SVG, e.g.
  `viewBox="0 0 640 140"`) holding the forge + fire, rendered above the rows.
- A **vertical worker-rows** block (HTML): one row per `view.workers` entry, each with
  label, raw `task` (or italic "idle"), a full-width progress bar (amber/forge-tinted
  when working, muted when idle), and a percent readout. Driven by `view.workers`
  directly — no derived `smiths` array needed (drop it, or reduce it to a trivial
  clamp pass if any clamping is desired; the view-model already clamps).
- *(Optional, R5)* a small **anvil-sparks** ember effect in the banner, CSS-animated,
  reduced-motion-gated. Cut-able.

## Component shape (after)

```
<script setup>
  props: { view: EnvironmentView | null }
  pct(p)                       // unchanged
  // no smiths/cx computed; iterate view.workers in the template
</script>

<template>
  v-if="view":
    header        → name + funds (kept)
    banner        → <svg> forge body + bs-fire flicker (+ optional sparks)   // R2
    workers       → v-for over view.workers → vertical rows (label/task/bar/%)// R1
    inventory     → shelf/chips (kept)                                        // R3
  v-else:
    "No blacksmith data."                                                     // kept
</template>

<style scoped>
  bs-fire flicker (kept) + reduced-motion guard
  bs-bar width transition (kept)
  // bs-arm / bs-strike / bs-idle figure rules removed
  // optional: spark keyframes (reduced-motion-gated)
</style>
```

## Worker row design (R1)

- Container: `flex flex-col gap-2` (vertical), consistent with the generic view.
- Row: label on the left; `task` on the right — `text-green-400` style accent when
  `status === 'working'`, muted `italic "idle"` when idle (R1.3/R1.4); a progress bar
  beneath (`h-2 rounded`, track + fill, `width: pct(progress)`), with the percent shown
  alongside or under it. Forge-tinted (amber) fill is acceptable as long as
  working-vs-idle stays distinct.
- Keys: use `worker.label` (index-unique). No `cx`. Works for 0/1/N workers (R1.5);
  show a muted "No workers" line when the list is empty.

## Read-only & isolation (R4)

No new imports beyond `vue` + the `EnvironmentView` type. No engine/controller access,
no mutation, **no `three`**. Registry and view-model untouched — the existing
`BuildingID.BlackSmith → BlacksmithView2D.vue` async entry still resolves.

## Verification

1. `npx vue-tsc -b --force` — no new errors, no new `any`.
2. Dev server: select the Blacksmith → vertical rows render; a **working** smith's bar
   fills and its `task` shows the raw identifier; an **idle** smith reads as idle; the
   furnace banner sits above and flickers; funds + inventory show and **update each
   tick** (parent's #1 feasibility item — confirm live updates survive the rewrite).
3. Toggle OS "reduce motion" → flicker (and sparks) stop; bars still fill.
4. Grep the component for `bs-strike` / `bs-arm` / figure markup / `cx` → none remain
   (R1.6).
5. 5-second legibility (parent R3.5): who's working + on what + progress, stock, funds —
   at a glance.
