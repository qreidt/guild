# Architecture Spec

## Stack

- Vue 3 with Single File Components
- TypeScript in `type: module` mode
- Vite for dev/build tooling
- Tailwind CSS v4 through `@tailwindcss/vite`
- No backend, no database, no persistent storage

## Runtime model

The application is a client-only SPA.

- `src/main.ts` mounts `App.vue`
- `App.vue` wraps singleton class instances in Vue reactivity
- gameplay state lives in plain TypeScript classes rather than a store library
- all state is ephemeral and resets on browser refresh

## High-level module map

### UI layer

- `App.vue`: top-level screen and bindings between UI and game state
- `Layout.vue`: fixed header/body/footer shell with optional sidebars
- `components/Button.vue`: small reusable button primitive
- `components/left-menu/BuildingsList.vue`: building selector sidebar

### Game domain layer

- `game/controllers/GameController.ts`: global simulation clock and pause/resume behavior
- `game/city/City.ts`: root city aggregate
- `game/city/buildings/**`: concrete building implementations, workers, and actions
- `game/adventurer/**`: adventurer and equipment domain model

### Items module

- `modules/items/id.ts`: `ItemID` enum covering all goods, weapons, and armor
- `modules/items/item.ts`: abstract base classes — `Item`, `ItemInstance`, `EquippableItem`
- `modules/items/registry.ts`: `ItemRegistry` mapping every `ItemID` to its class constructor
- `modules/items/values/goods.ts`: stackable goods (Lumber, WoodPlank, IronOre, IronIngot)
- `modules/items/values/weapons.ts`: weapon classes, `WeaponType`, `WeaponID`, `WeaponRegistry`
- `modules/items/values/armor.ts`: armor classes, `ArmorType`, `ArmorID`, `ArmorRegistry`

### Inventory/accounting layer

- `modules/inventory/common.ts`: account and transaction types
- `modules/inventory/inventory.repository.ts`: in-memory account repository plus transaction storage
- `modules/inventory/inventory.service.ts`: account-scoped service wrapper
- `modules/inventory/transaction.service.ts`: transaction creation and commit workflow

## State ownership

### Global game state

Owned by the `GameController` singleton:

- `running`
- `tick`
- `city`
- timer lifecycle for auto-ticking

### City state

Owned by `City`:

- `citizens_count`
- `money`
- `buildings`
- legacy `inventory`

### Building state

Owned by each `BaseBuilding` subclass:

- `building_id`
- `name`
- `level`
- `money`
- `workers`
- `inventory` account service

### Inventory state

Owned by `InventoryRepository`:

- account map keyed by string inventory IDs
- transaction map keyed by generated transaction IDs

## Tick lifecycle

1. `GameController.nextTick()` clears any previous timeout.
2. If the game is paused and the tick was not forced, no simulation occurs.
3. `City.handleTick()` runs.
4. `City` delegates to every building with `building.handleTick(city)`.
5. Each building:
   - finds available workers
   - assigns a new action to each available worker
   - starts those actions
   - ticks every worker's active action
6. Actions decrement `ticks_remaining` when allowed to tick.
7. Finished actions commit their side effects.
8. The controller increments the global tick and schedules the next auto-tick when running.

## UI data flow

- `App.vue` reads the singleton `GameController` and `inventoryRepository` through `reactive(...)`.
- `city` and `buildings` are taken directly from the controller's city instance.
- the currently selected building ID is held in a local Vue `ref`.
- the active building is a computed lookup against the city's building map.

This keeps the prototype simple, but it tightly couples the UI to mutable singleton class instances.

## Build and deployment

- `npm run dev`: local Vite development server
- `npm run build`: `vue-tsc -b && vite build`
- Vite base path: `/guild/`
- The configured base path indicates intended GitHub Pages deployment under a repository subpath

## Non-functional characteristics

- Persistence: none
- Testing: none in the repository
- Networking: none at runtime
- Save compatibility: not applicable yet
- Performance: trivial current state; all simulation is local and low-volume

## Known technical gaps

### Architectural limitations

- No persistence layer exists, so the game cannot be saved or resumed.
- No formal state management library is used, so cross-component growth will increase coupling pressure.
- The day/night API exists but always returns `false`, so time-of-day behavior is not active.
- Several action classes rely on partially configured transaction metadata, so accounting behavior is not yet robust enough to serve as a stable economy foundation.
- `validateLedger` in `InventoryRepository` uses `forEach` with an early `return false` inside the callback, which exits only the callback — validation always returns `true`. Economy integrity is not enforced until this is fixed.
- Equipment stats (damage, armor value, weight, value) are uniform placeholders across all item classes; differentiation by tier is needed before combat or crafting comparisons are meaningful.
- `damage_value` and `armor_value` are computed once in the constructor and never updated; they should be getters so they reflect wear changes over time.

## Intended evolution

The architecture is already pointing toward a layered simulation:

- city as aggregate root
- buildings as production subsystems
- adventurers as downstream consumers of produced equipment
- expeditions as value-generating external loops

The next architectural milestone should be to stabilize typing and economic accounting before expanding content breadth.
