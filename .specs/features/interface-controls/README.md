# Interface And Controls Feature

## Status

Prototype, minimally implemented

## Goal

Provide a readable browser interface for observing the city simulation and interacting with the game clock.

## Screen structure

The app uses a fixed three-region shell:

- fixed top header
- scrollable middle content area with left and right sidebars
- fixed bottom footer

## Header

The header currently shows:

- the title `City`
- the visible city money value
- the visible citizen count

## Left sidebar

The left sidebar currently contains a `Buildings` list.

Behavior:

- every building in the city's `buildings` map is rendered
- clicking a building emits a `buildingClicked` event
- the selected building is highlighted

## Main content

The current main content area only renders the currently selected building as a raw `<pre>` dump.

Current consequence:

- the player can inspect low-level building object state
- there is no designed panel for workers, inventories, recipes, or actions yet

## Right sidebar

The layout component supports a right sidebar, but no content is currently mounted into it by `App.vue`.

## Footer controls

The footer currently shows:

- current tick number
- `Pause` or `Resume` button depending on controller state
- `Next Tick` button for forced manual advancement

## Visual style

- Tailwind utility classes define most styling
- fixed header and footer each use dark gray backgrounds
- the body uses a light background
- dark mode toggles exist in `Layout.vue` but are not wired to any control

## UX limitations

- there is no onboarding or explanation of what buildings do
- there are no building detail cards, tables, or progress bars
- there is no inventory inspector
- there is no direct action queue visibility
- there are no responsive interaction patterns beyond the base flex layout
- there is no player input beyond building selection and time controls

## Intended next UI milestone

The next meaningful UI step should be a proper building detail panel that shows:

- building identity and level
- workers and active actions
- building inventory contents
- recipe thresholds and current production choice
- building-local money generation
