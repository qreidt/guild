# `.cycles`: one folder per cycle of work

A cycle is one Linear issue worth of work. Each cycle folder holds the full spec for
that work:

1. `request.md`: the brief as received. Nobody edits it after intake.
2. `refined-brief.md`, optional: the output of the `refine-request` command, one round
   of critique and questions on the request.
3. `requirements.md`, `plan.md` and `tasks.md`: the spec, authored in the cycle folder.
   `tasks.md` uses the `[ ]`, `[-]` and `[x]` markers.

Name the folder `cqr-<n>-<slug>`, after the Linear issue. If the cycle starts before the
issue exists, name the folder `<slug>` alone. Rename it when the issue exists.

When the build deviates from the spec, record the deviation as an as-built delta on the
affected requirement. Do not rewrite the original brief.

The other files under `.specs/` are the canonical current-state docs. Update them in the
same change that ships the code.

## The spec-workflow MCP server

The `spec-workflow` MCP server reads `.spec-workflow/specs/<name>/` only. It does not see
the cycle folders here, so its `spec-status` tool reports every CQR cycle as "not found".
The one spec it tracks is `city-market`, authored in April 2026 before the cycle folders
existed. To track a future cycle with the server, author that cycle under
`.spec-workflow/specs/` instead.

## Cycles

- [CQR-53](https://linear.app/cqr/issue/CQR-53/read-only-environment-interfaces-2d-vs-3d-bake-off-vertical-slice),
  folder [cqr-53-read-only-environment-interfaces/](./cqr-53-read-only-environment-interfaces/).
  Read-only environment interfaces, the 2D-vs-3D bake-off.
  **Status: implemented** on 2026-07-30, merged as `16e0c36`. All 7 tasks complete, plus
  the two sub-features below. Outcome: 2D interiors for buildings, a 3D backdrop for the
  city. The measured comparison is in
  [features/environment-interfaces/2d-vs-3d-decision.md](../features/environment-interfaces/2d-vs-3d-decision.md).
  - Sub-feature [2d-buildings-interface/](./cqr-53-read-only-environment-interfaces/2d-buildings-interface/):
    the Blacksmith interior with vertical progress rows, then extracted into the shared
    `BuildingInterior2D` shell for the Lumber Mill and Iron Mine. 7 tasks complete.
  - Sub-feature [3d-city-grid/](./cqr-53-read-only-environment-interfaces/3d-city-grid/):
    the 3D city as an authored grid map with walls, roads and one occupant per cell.
    10 tasks complete. CQR-59 Phase A superseded its wall coordinates. The as-built notes
    in its `plan.md` and `requirements.md` point there.
- [CQR-59](https://linear.app/cqr/issue/CQR-59), folder
  [cqr-59-apothecary-herbs-and-potions/](./cqr-59-apothecary-herbs-and-potions/).
  The Apothecary building: the foraged-herb catalog as items, health and mana potion
  brewing, and 2D/3D parity with the CQR-53 environments. One combined spec, phased
  A (city expansion) then B (Apothecary).
  **Status: implemented** on 2026-07-31, branch `feat/CQR-59`. All 9 tasks complete.
  Phase A grew the walled interior to `i −8…4` × `j −6…6` (41 free 2×2 anchors).
  Phase B shipped 35 items, the `Apothecary` building with two brew actions, a violet
  2D interior and a 3D hero mesh at `[-8, 1]`. As-built deltas are on the affected
  requirements in [requirements.md](./cqr-59-apothecary-herbs-and-potions/requirements.md).
  - Sub-feature [city-expansion/](./cqr-59-apothecary-herbs-and-potions/city-expansion/):
    grow the walled town inland. The interior was full, with 0 free plots, so the
    Apothecary could not sit inside the walls. Folded into the combined brief as Phase A.
- [CQR-60](https://linear.app/cqr/issue/CQR-60), folder
  [cqr-60-adventurers-guild-quest-system/](./cqr-60-adventurers-guild-quest-system/).
  The Adventurers' Guild and the quest board. A building that needs something it cannot
  make posts a funded quest for it. Phase 1 of two: the board, the posting and the
  settlement rules, but not the adventurer who does the work.
  **Status: implemented** on 2026-07-31, branch `CQR-60`. All 6 tasks complete.
  New `src/modules/quests/` board service and `src/modules/world/location.ts`. A
  `reviewQuests()` per-tick hook on `BaseBuilding` that the Apothecary overrides. The
  `AdventurersGuild` building at anchor `[3, 4]`, a read-only board panel, a 3D hero
  mesh, and the `quests`, `claim` and `fulfil` console commands. As-built deltas are on
  the affected requirements in
  [requirements.md](./cqr-60-adventurers-guild-quest-system/requirements.md).
  The seeded-random prefactor moved to [CQR-65](https://linear.app/cqr/issue/CQR-65).
  It would have shipped dead here.
- [CQR-61](https://linear.app/cqr/issue/CQR-61), folder
  [cqr-61-basic-adventurer/](./cqr-61-basic-adventurer/).
  The basic adventurer, Phase 2 of the quest work. One Scout claims the first open
  gather quest, walks to the Forest, forages over repeated shifts, walks home, delivers
  the goods to the poster and collects the reward the poster paid up front. Includes CQR-65, one seeded
  random stream per actor.
  **Status: implemented** on 2026-08-02, branch `CQR-61`, merged as `3413c7a`. All 6
  tasks complete. New `src/modules/adventurers/` roster service, ticked as a sibling of
  the city, `src/modules/random/`, three adventurer actions (travel, forage, deliver),
  the roster screen, and the `adventurers` and `seed` console commands. As-built deltas
  are on the affected requirements in
  [requirements.md](./cqr-61-basic-adventurer/requirements.md).
- No Linear issue yet, folder
  [show-completed-action-state/](./show-completed-action-state/).
  Show the completed action state. A finished action stays on its worker for one tick
  and the view reports it as "idle, 0%", so the bar never reaches 100%. The request: show
  100% for that tick, together with the next action at 0%.
  **Status: refined** on 2026-09-12, branch `fix/show-completed-state`. The decisions are
  in [refined-brief.md](./show-completed-action-state/refined-brief.md). The hand-off
  timing is ADR 0007.
