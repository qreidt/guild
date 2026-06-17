# Console Harness Feature

## Status

Planned, not yet implemented.

## Goal

Allow the game's simulation layer (`GameController`, `City`, buildings, inventory, market) to be driven and inspected from a terminal session via a single npm command, without launching Vite or a browser.

The console harness is a **testing and debugging surface**, not a second game client. It should expose the same domain objects the Vue UI wraps today, so behavior observed in the terminal is the same behavior the browser would produce.

## Why

- The simulation layer is plain TypeScript and has no browser dependencies (no `window`, `document`, `localStorage`, or DOM access inside `src/game/**` or `src/modules/**`).
- There is no test runner in the project. Today, the only way to exercise a tick, trade, or worker action is to open the browser, click Resume, and inspect `<pre>` dumps.
- A headless harness lets us:
  - reproduce a scenario deterministically (`tick 20`, then inspect state)
  - drive the economy without waiting for the 0.5 s auto-tick interval
  - capture state dumps for regression comparisons
  - seed future automated tests from the same entrypoint

## Non-goals

- No Vue, no rendering, no DOM.
- No persistence or save/load — state still resets on process exit.
- Not a replacement for a real test runner; it is a manual/interactive harness.
- Does not fork the game logic; it imports the same singletons as `App.vue`.

## Entrypoint

`src/console.ts` — the single file the npm script runs. It must:

1. Import the existing `GameController` default export (same singleton `App.vue` uses).
2. Import `inventoryRepository` and `marketService` so their state can be inspected.
3. Open a Node `readline` REPL on stdin/stdout.
4. Parse one line at a time as `<command> [args...]` and dispatch to a command table.
5. Print results as plain text (no ANSI colors required for MVP).
6. Exit cleanly on `quit`, `exit`, or EOF (Ctrl+D / Ctrl+C).

The harness must not duplicate game logic. Every command is a thin wrapper around existing domain methods.

## Command surface (MVP)

| Command | Description |
|---|---|
| `help` | List commands. |
| `status` | Print `tick`, `running`, `city.money`, `city.citizens_count`, and `isNight()`. |
| `tick [n]` | Force-advance the simulation `n` ticks (default 1). Uses `GameController.nextTick(true)` in a loop so ticks run even while paused. |
| `run <seconds>` | Call `resume()`, wait the given seconds of wall-clock time, then `pause()`. Lets you watch auto-ticking without hand-stepping. |
| `pause` | `GameController.pause()`. |
| `resume` | `GameController.resume()`. |
| `buildings` | List every building in `city.buildings` with ID, name, level, money, and worker count. |
| `inspect <buildingId>` | Dump one building: workers, each worker's current action, inventory account snapshot, money. |
| `inventory [accountId]` | Without args, list all account IDs in `InventoryRepository`. With an arg, dump that account's balances and recent transactions. |
| `market` | Show the current `Market` buildings's offers and recent trade history from `marketService`. |
| `give <accountId> <itemId> <qty>` | Debug-only: commit a transaction that adds items to an account so you can test downstream flows without running production ticks. |
| `quit` / `exit` | Leave the REPL. |

All commands are synchronous except `run <seconds>`, which returns when the timer resolves. The REPL prompt does not re-display while `run` is active; output from auto-ticks streams inline.

## Non-interactive mode (stretch)

If the process is launched with argv beyond the script name, join the args into one command string, execute it, print the result, and exit. This lets scripts do:

```bash
npm run console -- tick 50
npm run console -- status
```

Not required for MVP, but the command dispatch should be written so this is a one-line addition later.

## Implementation plan

### 1. Add a TypeScript runner

The simulation layer is ESM TypeScript. The lightest option that preserves `"type": "module"` and needs zero config:

- Add `tsx` as a `devDependency`.
- Add npm script: `"console": "tsx src/console.ts"`.

`tsx` runs TypeScript ESM directly on Node without a build step and honors the existing `tsconfig.app.json`. Alternatives considered and rejected for MVP:

- `ts-node --esm` — heavier config, slower startup, historically finicky with ESM + NodeNext.
- Pre-compiling with `tsc` then running `node dist/console.js` — doubles the build surface and forces us to keep a second tsconfig output target.

### 2. Create `src/console.ts`

Skeleton responsibilities, in order:

1. Import `gameController` (default export from `src/game/controllers/GameController.ts`).
2. Import `inventoryRepository` from `src/modules/inventory/inventory.repository.ts`.
3. Import `marketService` from `src/modules/market/market.service.ts`.
4. Build a `commands: Record<string, (args: string[]) => void | Promise<void>>` map.
5. Start `readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'guild> ' })`.
6. On each line, split on whitespace, look up the command, run it, re-prompt.
7. On `SIGINT` and `close`, call `gameController.pause()` and `process.exit(0)`.

The harness file stays under ~200 lines. No new classes — it is pure glue.

### 3. Update `package.json`

- Add `tsx` to `devDependencies`.
- Add `"console": "tsx src/console.ts"` to `scripts`.
- Do not change `dev`, `build`, or `preview`.

### 4. Update documentation

- Add a "Headless console" section to the top-level `README.md` showing the npm command and a short command reference.
- Add this feature spec to `.specs/features/console-harness/`.
- Link it from `.specs/README.md`.
- Note the new entrypoint in `.specs/architecture.md` under "Build and deployment" so the architecture doc stays accurate.

### 5. Smoke test checklist

After implementation, verify by hand:

- `npm run console` starts the REPL and prints a prompt.
- `status` reports `tick: 0`, `running: false`, non-zero money.
- `tick 10` advances the global tick by 10 and lets each building's workers produce at least one commit.
- `buildings` lists LumberMill, IronMine, BlackSmith, Market.
- `inspect LumberMill` shows workers with actions mid-progress after a few ticks.
- `inventory City` prints the city account.
- `market` prints at least the Market building's current state.
- `quit` exits the process cleanly with code 0.
- `npm run build` still passes — adding the console entrypoint must not break the Vite build.

## Known considerations

- `GameController.timeout_id` is typed `null | number`, which is the DOM `setTimeout` return type. Under Node, `setTimeout` returns `NodeJS.Timeout`. At runtime this is harmless because `clearTimeout` and the truthy check both work with the Node handle; `tsx` does not re-type-check at run time. If a future cleanup narrows that type, the harness must continue to work on both runtimes.
- `GameController` and `City` log to `console` at module load. That is fine for the CLI but means the REPL prints a few lines before the first prompt.
- The current `isNight()` is stubbed to always return `false`. The harness should still surface it in `status` so day/night work later has an obvious place to verify.
- The harness shares the singleton with the (hypothetical) Vue app — but in Node mode the Vue app is never mounted, so there is no cross-contamination.

## Out of scope for this spec

- Snapshot/replay of tick history.
- Seeded randomness or deterministic scenarios.
- Automated assertions (that belongs in a real test runner, added later).
- Color output, line editing niceties, command history persistence.
