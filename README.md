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
cd guild
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

### Headless console

Guild also ships a terminal-only harness for driving the simulation without a browser. It runs the exact same `GameController`, `City`, buildings, and inventory singletons the Vue UI wraps, so behavior in the REPL matches behavior in the browser.

Start it with:

```bash
npm run console
```

Type `help` at the prompt for the command list.

The entrypoint lives at `src/console.ts` and is run through `tsx` — no build step, no Vite, no DOM. See [.specs/features/console-harness](./.specs/features/console-harness/README.md) for the full spec and rationale.
