# Guild (Adventurer Fantasy City Manager)

Welcome to **Guild**, a browser-based city management simulation built with **Vue**, and **TypeScript**.
In this game, you take on the role of a city ruler in a medieval fantasy world, managing adventurers, resources,
and city development while facing the challenges of a growing magical realm.

[Check it now](https://qreidt.github.io/guild/)

## Objectives/Roadmap

- [ ] Manage resources like gold, food, and population
- [ ] Recruit and manage adventurers with unique skills and traits
- [ ] Construct and upgrade city buildings to improve your economy and defense
- [ ] Send adventurers on quests and defend the city from threats and gather resources
- [ ] Adventurer traits and leveling system
- [ ] Save/load game state to local storage
- [ ] Explore dungeons/labyrinths

## Ideas
- [Adventurer](./src/game/adventurer/_.md)
- [Any](./_.md)

## Tech Stack

- **[Vue 3](https://vuejs.org/)** - The progressive JavaScript framework
- **[TypeScript](https://www.typescriptlang.org/)** - Strongly typed JavaScript

## Getting Started

### Prerequisites

- Node.js `>= 22`

### Installation

Clone the repository:

```bash
git clone https://github.com/qreidt/guild.git
cd fantasy-city-manager
```

Install dependencies:
```bash
npm install
```

### Running in the browser

```bash
npm run dev      # Vite dev server at http://localhost:5173/guild/
npm run build    # type-check + production build
npm run preview  # preview the built output
```

### Headless console (planned)

Guild also ships a terminal-only harness for driving the simulation without a browser. It runs the exact same `GameController`, `City`, buildings, and inventory singletons the Vue UI wraps, so behavior in the REPL matches behavior in the browser.

Start it with:

```bash
npm run console
```

You will get an interactive prompt:

```
guild> status
tick: 0   running: false   money: 500   citizens: 100   night: false
guild> tick 10
(advances 10 simulation ticks)
guild> buildings
- LumberMill  level 1  money 0  workers 3
- IronMine    level 1  money 0  workers 3
- BlackSmith  level 1  money 0  workers 2
- Market      level 1  money 0  workers 0
guild> inspect LumberMill
(dumps workers, their current actions, inventory account, and money)
guild> inventory City
(dumps the city account and recent transactions)
guild> market
(dumps current offers and trade history)
guild> run 5
(resumes auto-tick for 5 seconds, then pauses)
guild> quit
```

Core commands:

| Command | What it does |
|---|---|
| `help` | List all commands. |
| `status` | Print tick, running flag, city money, citizens, and `isNight()`. |
| `tick [n]` | Force-advance the simulation by `n` ticks (default 1), even while paused. |
| `run <seconds>` | Resume auto-tick for a wall-clock duration, then pause. |
| `pause` / `resume` | Toggle the game loop. |
| `buildings` | List every building with ID, level, money, worker count. |
| `inspect <buildingId>` | Dump one building's workers, actions, inventory, and money. |
| `inventory [accountId]` | List accounts or dump a specific account's balances and transactions. |
| `market` | Show current market offers and trade history. |
| `give <accountId> <itemId> <qty>` | Debug: inject items into an account to test downstream flows. |
| `quit` / `exit` | Exit the REPL. |

The entrypoint lives at `src/console.ts` and is run through `tsx` — no build step, no Vite, no DOM. See [.specs/features/console-harness](./.specs/features/console-harness/README.md) for the full spec and rationale.

> **Status:** the spec for this command is checked in at `.specs/features/console-harness/README.md`. The `src/console.ts` entrypoint and `npm run console` script are planned and land in a follow-up change.
