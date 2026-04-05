# World And Expeditions Feature

## Status

Planned only

## Goal

Extend the city-management prototype into a broader game loop where the player sends adventurers into dangerous zones, earns loot and resources, and reinvests the results into the city.

## Planned domain entities from design notes

### Mission

Planned fields:

- rank
- reward

### Adventure

Planned fields:

- mission
- adventurer group
- loot
- slayed targets

### Monster

Planned fields:

- rank
- health
- type

### Zone

Zones are intended to package danger, available enemies, and exploration targets.

## Planned zones

### Forest

Planned characteristics:

- outdoor danger area
- wildlife and low-tier enemy encounters

Planned inhabitants:

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

### Labyrinth

Planned characteristics:

- level-based dungeon structure
- traps
- deeper enemy progression

Planned enemies:

- goblins
- slimes
- skeletons
- mushroom spawn
- giant rats
- zombies

Planned bosses:

- Goblin Chief
- Sewer King Rat
- Flame Wisp Alpha
- Bone Warden

## Planned loop integration

The intended expedition loop appears to be:

1. Build city economy and craft gear.
2. Recruit or manage adventurers.
3. Match adventurer strength to mission or zone danger.
4. Resolve combat, losses, and loot.
5. Return gains to the city as money, equipment, or crafting materials.

## Dependencies on other systems

This feature depends on at least:

- stable city economy
- functioning inventory transfers
- adventurer roster management
- item and equipment flow
- outcome resolution rules for combat and loot

## Current implementation state

No gameplay, UI, or persistence for missions, monsters, adventures, or zones currently exists in the repository. This feature is documented here so the city prototype can evolve toward it without losing the intended game direction.
