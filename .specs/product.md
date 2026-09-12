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

The current codebase is the city-simulation slice of the full game, plus the first adventurer. The implemented scope today is:

- one city with fixed starting stats
- six buildings: Lumber Mill, Iron Mine, BlackSmith, Apothecary, Adventurers' Guild and Market
- workers that execute time-based actions
- in-memory inventories and inventory transactions
- a goods catalog with raw materials, iron equipment, and the Apothecary's herbs and potions
- a Market that buys producer output, sells stock to buildings and exports at catalog prices
- a quest board where a building posts a funded gather quest for goods it cannot make
- one seeded adventurer who claims a quest, forages in the Forest and delivers
- a read-only interface: a 3D city view, a 2D interior per building, a Market panel and an adventurer roster

The following core game systems are not yet integrated into the playable surface:

- adventurer recruitment, parties and progression
- combat and mission resolution
- save/load
- local economy balancing
- city growth or population simulation
- construction and upgrades

## Core loop

### Current implemented loop

1. The player opens the city screen.
2. The player resumes time or advances the game one tick at a time.
3. Buildings assign available workers to actions.
4. Actions consume time and may consume or produce goods.
5. Producers sell their output to the Market. The BlackSmith buys inputs it lacks from the Market.
6. The Apothecary posts a funded quest for herbs it cannot make.
7. The adventurer claims the quest, forages the herbs and delivers them for the reward the Apothecary paid up front.

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
- an inventory account keyed `City`
- a reference to the Market

### Building

A city subsystem that owns workers, a building-specific money counter, and an inventory account. Buildings choose actions for idle workers on each tick. A building may also review the quest board on each tick and post a quest.

### Worker

A unit of production capacity inside a building. Each worker can perform one action at a time.

### Action

A time-based unit of work. An action may validate inputs, reserve goods through a transaction, tick down over time, and commit results when complete. Adventurer actions (travel, forage, deliver) extend the same base.

### Good

A stackable economic item such as lumber, wood planks, iron ore, iron ingots, or a herb.

### Equipment

An equippable item with durability-related degradation, such as swords, spears, shields, and armor pieces.

### Adventurer

A unit that belongs to no building, with class, rank, attributes, proficiencies, inventory, equipment slots and a wallet. One Scout exists today. The adventurer claims gather quests, travels, forages and delivers on its own. The player cannot recruit, equip or direct one yet.

### Quest

A funded request that a building posts on the board for goods it cannot make. The poster pays the reward when it posts the quest. The quest holds the money until delivery. Gather is the only objective kind today.

### Mission / Adventure / Zone

Planned systems that connect the city economy to combat, loot, and exploration. A `Location` enum with travel costs exists for the adventurer's trips to the Forest. `Zone` is reserved and unmodelled. Missions and combat are described in the roadmap and world feature spec but are not implemented in gameplay yet.

## Product boundaries

### In scope for the current prototype baseline

- city dashboard
- global ticking
- building simulation
- resource transformation
- the Market
- the quest board and one adventurer
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
