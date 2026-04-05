# Product Spec

## Product identity

Guild is a browser-based medieval fantasy city manager. The player acts as the ruler or operator of a settlement that grows its economy, produces goods, equips adventurers, and eventually sends them into dangerous zones for profit and survival.

## Player fantasy

The intended fantasy is:

- build and oversee a growing frontier city
- turn raw materials into trade goods and equipment
- assemble and improve adventurers
- send parties into forests and labyrinths to recover loot and survive escalating threats

## Design pillars

- Simulation-first: the city should feel like a living production system driven by workers, time, and resources.
- Readable economy: buildings should transform clear inputs into clear outputs.
- Adventure payoff: city progression should feed expedition strength, and expeditions should feed city growth.
- Incremental complexity: the prototype starts with a few buildings and resource loops, then expands into parties, missions, and zones.

## Current prototype scope

The current codebase represents the earliest city-simulation slice of the full game. The implemented scope today is:

- one city with fixed starting stats
- three buildings
- workers that execute time-based actions
- in-memory inventories and inventory transactions
- a simple goods catalog with raw materials and iron equipment
- a placeholder player interface for inspecting buildings and advancing time

The following core game systems are not yet integrated into the playable surface:

- adventurer recruitment and management
- combat and mission resolution
- save/load
- local economy balancing
- city growth or population simulation
- construction and upgrades

## Core loop

### Current implemented loop

1. The player opens the city dashboard.
2. The player resumes time or advances the game one tick at a time.
3. Buildings assign available workers to actions.
4. Actions consume time and may consume or produce goods.
5. Some buildings attempt to convert stored goods into sale value.

### Intended extended loop

1. Gather or produce resources in specialized buildings.
2. Refine materials into trade goods and equipment.
3. Recruit, equip, and improve adventurers.
4. Send adventurers or parties on missions into zones.
5. Return loot, gold, and crafting inputs back to the city.
6. Reinvest in buildings, gear, and higher-risk expeditions.

## Domain glossary

### City

The main player-controlled settlement. It currently stores:

- citizen count
- city-wide money display
- a collection of buildings
- a legacy city inventory object

### Building

A city subsystem that owns workers, a building-specific money counter, and an inventory account. Buildings choose actions for idle workers on each tick.

### Worker

A unit of production capacity inside a building. Each worker can perform one action at a time.

### Action

A time-based unit of work. An action may validate inputs, reserve goods through a transaction, tick down over time, and commit results when complete.

### Good

A stackable economic item such as lumber, wood planks, iron ore, or iron ingots.

### Equipment

An equippable item with durability-related degradation, such as swords, spears, shields, and armor pieces.

### Adventurer

A future player-managed unit with class, rank, attributes, proficiencies, inventory, and equipment slots.

### Mission / Adventure / Zone

Planned systems that connect the city economy to combat, loot, and exploration. These are described in the roadmap and world feature spec but are not implemented in gameplay yet.

## Product boundaries

### In scope for the current prototype baseline

- city dashboard
- global ticking
- building simulation
- resource transformation
- gear production definitions
- in-memory state

### Out of scope for the current prototype baseline

- multiplayer
- backend services
- remote persistence
- account systems
- procedural world generation
- polished combat UI

## Success criteria for the current prototype

The current prototype should eventually support a stable, understandable city sandbox where:

- time can progress predictably
- buildings can produce and transform goods without manual scripting
- the player can inspect meaningful building state
- produced value flows into a visible economy
- the codebase can be extended toward adventurers and expeditions without rewriting the core loop
