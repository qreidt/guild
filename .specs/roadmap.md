# Roadmap Spec

This roadmap combines explicit goals from `README.md` with the additional design notes in `_.md` and `src/game/adventurer/_.md`.

## Current maturity

The project is at prototype stage. The code already sketches the resource-production backbone of the game, but most player-facing progression systems are still planned.

## Near-term roadmap

### 1. Stabilize the prototype

- fix current TypeScript build failures
- reconcile intended building recipes with actual action definitions
- make produced economic value visible at the city level
- replace the raw building object dump with a deliberate detail panel
- document and normalize inventory/accounting rules

### 2. Complete the city resource loop

- support reliable production of lumber, wood, ore, ingots, and finished gear
- expose building inventories and worker states in the UI
- add building upgrades and construction decisions
- expand the building roster beyond the first three production buildings

### 3. Introduce adventurer management

- recruit adventurers
- assign classes, gear, and inventories
- support traits, ranks, and leveling
- surface adventurers in the UI as managed roster entities

### 4. Add missions and expeditions

- create missions with rank and reward expectations
- assemble adventurer groups
- resolve outcomes such as loot, kills, and damage
- connect expeditions back into the city economy

### 5. Add persistence

- save and load game state through local storage
- preserve city, building, inventory, and adventurer progression

## Planned buildings from design notes

- Mine
- Lumber Mill
- Black Smith
- Tannery
- Fletcher
- Alchemist's Lab
- Hunter's Lodge

## Planned world content from design notes

### Forest zone

Expected creatures and gathering targets:

- boars
- wolves
- bears
- deer
- rabbits
- goblins
- slimes
- mushroom spawn
- bats
- bandits

### Labyrinth zone

Expected enemies:

- goblins
- slimes
- skeletons
- mushroom spawn
- giant rats
- zombies

Expected boss examples:

- Goblin Chief
- Sewer King Rat
- Flame Wisp Alpha
- Bone Warden

## Planned player systems from design notes

- adventurer ranks
- mission rank matching
- monster ranks
- loot tables
- zone danger ratings
- equipment durability
- crafting chains for armor, weapons, and consumables

## Roadmap risks

- the current economy model is not stable enough yet to support larger content additions safely
- the app needs a persistent save format before progression systems become meaningful
- the world and combat specs are broader than the current UI and architecture, so expansion should stay incremental
