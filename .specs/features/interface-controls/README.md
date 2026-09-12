# Interface and controls feature

## Status

Implemented, read-only. The Market panel is the one screen with controls beyond the
clock. Rewritten on 2026-09-12 to match `App.vue` after CQR-53, CQR-59, CQR-60 and
CQR-61.

## Goal

Give the player a readable browser interface for the city simulation and for the game
clock.

## Screen structure

`Layout.vue` is a fixed shell:

- a fixed top header
- a scrollable middle row with a left sidebar, the main area and a right sidebar
- a fixed bottom footer

## Header

The header shows:

- the title `City`. Clicking it clears the selection and shows the 3D city view
- the city money value
- the citizen count

## Left sidebar

The sidebar has two sections.

`Buildings` lists every entry in the city's `buildings` map. Clicking a building emits
`buildingClicked`, and the selected building is highlighted.

`People` has one row, `Adventurers`, which opens the roster. The roster is a screen of
its own, so selecting it clears the building selection.

## Main area

`App.vue` picks one of three renderers:

1. `AdventurerRoster.vue`, when `Adventurers` is selected.
2. `MarketPanel.vue`, when the Market is selected.
3. `EnvironmentView.vue` for everything else.

`EnvironmentView.vue` dispatches on `environment-registry.ts`, which maps a `BuildingID`
to an art component:

- No building selected: `CityGlobalView3D.vue`, the Three.js city backdrop. It is
  lazy-loaded, so `three` stays out of the initial bundle.
- Lumber Mill, Iron Mine, BlackSmith, Apothecary: a 2D SVG interior on the shared
  `BuildingInterior2D` shell. It shows the building name, its funds, one progress row per
  worker with the raw action name, and the inventory shelf.
- Adventurers' Guild: its own 2D view, with the quest board in place of workers and
  inventory.
- Any building without a registry entry: `GenericEnvironmentView.vue`, a plain table of
  workers and inventory. No building uses it today.

All of these read one view-model from `src/modules/environment-view/`. The composable in
`useEnvironmentView.ts` makes it reactive through the per-tick heartbeat. None of them
mutate game state.

### Market panel

`MarketPanel.vue` shows the stock with quantity and unit price, an export section with an
export-all button that converts stock into Market money, and the recent trades. It is the
only panel that writes to the simulation.

### Adventurer roster

`AdventurerRoster.vue` lists every adventurer with class, location, current action,
progress, claimed quest and carried goods. Read-only.

## Right sidebar

`Layout.vue` renders the right sidebar, but `App.vue` mounts nothing into it. It is an
empty column.

## Footer controls

The footer shows:

- the current tick number
- a `Pause` or `Resume` button, depending on controller state
- a `Next Tick` button that forces one tick, also while paused

## Visual style

- Tailwind utility classes define most styling
- the header and footer use dark gray backgrounds
- the body uses a light background
- a dark-mode flag exists in `Layout.vue`, but no control toggles it

## Limitations

- there is no onboarding or explanation of what buildings do
- the player cannot recruit, equip or direct adventurers
- the player cannot build, upgrade or reassign workers
- the layout is a fixed flex shell with no responsive breakpoints
- the right sidebar is empty

## Related

- [environment-interfaces/2d-vs-3d-decision.md](../environment-interfaces/2d-vs-3d-decision.md): why interiors are 2D and the city view is 3D
- [city-market/README.md](../city-market/README.md): the Market panel
- [console-harness/README.md](../console-harness/README.md): the terminal alternative to this interface
