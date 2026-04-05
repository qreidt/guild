# City Simulation Feature

## Status

Prototype, partially implemented

## Goal

Model a city as the root simulation object that advances over time, owns buildings, and exposes enough top-level state for the player to understand the settlement's condition.

## Current player-facing behavior

- The player sees a city header with money and citizen count.
- The player can pause, resume, or manually advance the simulation by one tick.
- The player can select a building from the sidebar to inspect it.

## Initial state

At application startup, the game controller creates one city with:

- `citizens_count = 100`
- `money = 500`
- `tick = 5`
- `running = false`
- buildings:
  - `LumberMill`
  - `IronMine`
  - `BlackSmith`

## Tick rules

- The game starts paused.
- `Resume` enables auto-ticking.
- `Pause` stops auto-ticking and clears the pending timeout.
- `Next Tick` forces one simulation step even while paused.
- The configured auto-tick interval is `0.5` seconds.

## Tick execution order

1. Clear any existing scheduled timeout.
2. Abort if the game is paused and the tick was not forced.
3. Let the city process one tick.
4. Let each building process one tick.
5. Increment the global tick counter.
6. Schedule the next timeout when running.

## Time-of-day model

The controller exposes an `isNight()` API and the action classes call it before progressing work. However, the current implementation always returns `false`.

Current consequence:

- all actions that depend on daylight are effectively allowed on every tick
- no sleeping or overnight slowdown behavior is active

## City-owned systems

### Buildings

The city stores buildings in a `Map<BuildingID, BaseBuilding>` and delegates work to each building every tick.

### Money

The city exposes a top-level `money` value to the UI. This appears to be intended as the visible city treasury.

### Citizens

The city exposes a top-level citizen count, but no current gameplay system consumes or changes it.

### Inventory

The city owns a legacy `Inventory` instance, but the active economic flow in the prototype is driven by the newer inventory-account system used by buildings and actions.

## Known implementation gaps

- The city has no growth, upkeep, hunger, happiness, defense, or event systems yet.
- The top-level money display does not currently reflect building-level sales automatically.
- The city inventory model is not the same model used by the active building economy.
- The day/night API is stubbed and does not change behavior.
