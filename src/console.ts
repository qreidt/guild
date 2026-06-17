/**
 * Headless console harness.
 *
 * Drives the same GameController/City/building/inventory/market singletons the
 * Vue UI uses, but from a Node REPL. See `.specs/features/console-harness/`
 * for the spec and rationale.
 *
 * Usage:
 *   npm run console                  # interactive REPL
 *   npm run console -- tick 10       # one-shot command
 *   npm run console -- status
 */

import readline from 'node:readline';
import gameController from './game/controllers/GameController.ts';
import inventoryRepository from './modules/inventory/inventory.repository.ts';
import marketService from './modules/market/market.service.ts';
import { BuildingID } from './game/city/buildings/common/Building.ts';
import { ItemID } from './modules/items/id.ts';
import { ItemRegistry } from './modules/items/registry.ts';

type CommandHandler = (args: string[]) => void | Promise<void>;

interface Command {
    help: string;
    run: CommandHandler;
}

function print(msg: string = ''): void {
    process.stdout.write(msg + '\n');
}

function findBuildingId(raw: string): BuildingID | null {
    const lower = raw.toLowerCase();
    for (const id of Object.values(BuildingID)) {
        if (String(id).toLowerCase() === lower) return id as BuildingID;
    }
    return null;
}

function findItemId(raw: string): ItemID | null {
    const lower = raw.toLowerCase();
    for (const id of Object.values(ItemID)) {
        if (String(id).toLowerCase() === lower) return id as ItemID;
    }
    return null;
}

function formatStacks(stacks: Map<ItemID, number>, indent: string): string[] {
    if (stacks.size === 0) return [`${indent}(empty)`];
    const rows: string[] = [];
    for (const [itemId, qty] of stacks) {
        rows.push(`${indent}${String(itemId).padEnd(20)} ${qty}`);
    }
    return rows;
}

const commands: Record<string, Command> = {
    help: {
        help: 'list all commands',
        run: () => {
            const width = Math.max(...Object.keys(commands).map((k) => k.length));
            print('commands:');
            for (const [name, cmd] of Object.entries(commands)) {
                print(`  ${name.padEnd(width)}  ${cmd.help}`);
            }
        },
    },

    status: {
        help: 'print tick, running, city money, citizens, night',
        run: () => {
            const city = gameController.city;
            print(
                `tick: ${gameController.tick}  running: ${gameController.running}  ` +
                `money: ${city.money}  citizens: ${city.citizens_count}  ` +
                `night: ${gameController.isNight()}`
            );
        },
    },

    tick: {
        help: 'tick [n] — force-advance n ticks (default 1), even while paused',
        run: (args) => {
            const n = args[0] ? Number(args[0]) : 1;
            if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
                print(`error: tick count must be a positive integer`);
                return;
            }
            for (let i = 0; i < n; i++) {
                gameController.nextTick(true);
            }
            // A pending auto-tick timer may have been scheduled by the final
            // nextTick. It's harmless (non-forced tick will short-circuit) but
            // keeps Node alive, so cancel it explicitly.
            gameController.pause();
            print(`advanced ${n} tick${n === 1 ? '' : 's'} → tick=${gameController.tick}`);
        },
    },

    run: {
        help: 'run <seconds> — resume auto-tick for N seconds, then pause',
        run: async (args) => {
            const secs = args[0] ? Number(args[0]) : NaN;
            if (!Number.isFinite(secs) || secs <= 0) {
                print(`error: usage: run <seconds>`);
                return;
            }
            print(`resuming for ${secs}s…`);
            const startTick = gameController.tick;
            gameController.resume();
            await new Promise((resolve) => setTimeout(resolve, secs * 1000));
            gameController.pause();
            const delta = gameController.tick - startTick;
            print(`paused at tick=${gameController.tick} (+${delta})`);
        },
    },

    pause: {
        help: 'pause the simulation',
        run: () => {
            gameController.pause();
            print('paused');
        },
    },

    resume: {
        help: 'resume the simulation (auto-ticks until pause)',
        run: () => {
            gameController.resume();
            print('running');
        },
    },

    buildings: {
        help: 'list every building',
        run: () => {
            print('buildings:');
            gameController.city.buildings.forEach((b, id) => {
                const name = (b.constructor as { name?: string }).name ?? String(id);
                print(
                    `  - ${String(id).padEnd(12)} ${name.padEnd(12)} ` +
                    `level ${b.level}  money ${b.money}  workers ${b.workers.length}`
                );
            });
        },
    },

    inspect: {
        help: 'inspect <buildingId> — dump workers, actions, inventory, money',
        run: (args) => {
            if (!args[0]) {
                print('usage: inspect <buildingId>');
                return;
            }
            const id = findBuildingId(args[0]);
            if (!id) {
                print(`error: unknown building '${args[0]}' — try 'buildings'`);
                return;
            }
            const b = gameController.city.buildings.get(id);
            if (!b) {
                print(`error: building '${id}' not registered in city`);
                return;
            }
            const name = (b.constructor as { name?: string }).name ?? String(id);
            print(`${name} (${id})`);
            print(`  level:   ${b.level}`);
            print(`  money:   ${b.money}`);
            print(`  workers: ${b.workers.length}`);
            b.workers.forEach((w, i) => {
                const action = w.active_action;
                if (!action) {
                    print(`    [${i}] idle`);
                } else {
                    const actionName = (action.constructor as { name?: string }).name ?? 'Action';
                    print(
                        `    [${i}] ${actionName}  ` +
                        `remaining=${action.ticks_remaining}/${action.total_ticks}  ` +
                        `status=${action.status}`
                    );
                }
            });
            print(`  inventory:`);
            formatStacks(b.inventory.getCountByGoodId(), '    ').forEach(print);
        },
    },

    inventory: {
        help: 'inventory [accountId] — list all accounts or dump one',
        run: (args) => {
            if (!args[0]) {
                const ids = Array.from(inventoryRepository.accounts.keys());
                if (ids.length === 0) {
                    print('(no accounts)');
                    return;
                }
                print('accounts:');
                ids.forEach((id) => print(`  - ${id}`));
                return;
            }
            const id = args[0];
            const account = inventoryRepository.accounts.get(id);
            if (!account) {
                print(`error: account '${id}' not found — try 'inventory' with no args`);
                return;
            }
            print(`${id}`);
            print(`  stacks:`);
            formatStacks(account.stacks, '    ').forEach(print);
            print(`  instances: ${account.instances.length}`);
            account.instances.forEach((inst, i) => {
                const itemId = (inst as { static?: { id?: string } }).static?.id ?? '?';
                print(`    [${i}] ${itemId}`);
            });
            const pending = Array.from(inventoryRepository.transactions.entries())
                .filter(([, t]) => t.origin === id || t.destination === id);
            if (pending.length > 0) {
                print(`  pending transactions: ${pending.length}`);
                pending.forEach(([txid, t]) =>
                    print(`    ${txid}  (${t.origin ?? 'null'} → ${t.destination})`)
                );
            }
        },
    },

    market: {
        help: 'show market stock and recent trades',
        run: () => {
            const market = gameController.city.market;
            print(`Market`);
            print(`  money: ${market.money}`);
            const stock = marketService.getStock();
            if (stock.size === 0) {
                print(`  stock: (empty)`);
            } else {
                print(`  stock:`);
                for (const [itemId, qty] of stock) {
                    const price = marketService.getPrice(itemId);
                    print(`    ${String(itemId).padEnd(20)} qty=${String(qty).padEnd(6)} price=${price}`);
                }
            }
            if (marketService.recentTrades.length === 0) {
                print(`  trades: (none)`);
                return;
            }
            print(`  recent trades:`);
            for (const t of marketService.recentTrades) {
                const itemsStr = Array.from(t.items.entries())
                    .map(([i, q]) => `${i}x${q}`)
                    .join(',');
                print(`    [tick ${t.tick}] ${t.side.padEnd(4)} ${t.counterpartyId.padEnd(12)} ${itemsStr} total=${t.total}`);
            }
        },
    },

    give: {
        help: 'give <accountId> <itemId> <qty> — inject stackable items (debug)',
        run: (args) => {
            if (args.length < 3) {
                print('usage: give <accountId> <itemId> <qty>');
                return;
            }
            const [accountId, itemRaw, qtyRaw] = args;
            const itemId = findItemId(itemRaw);
            if (!itemId) {
                print(`error: unknown item '${itemRaw}'`);
                return;
            }
            const qty = Number(qtyRaw);
            if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
                print(`error: qty must be a positive integer`);
                return;
            }
            const item = ItemRegistry[itemId];
            if (!item.stackable) {
                print(`error: '${itemId}' is equippable, not a stackable good (not supported by give)`);
                return;
            }
            inventoryRepository.putGood(accountId, itemId, qty);
            print(`gave ${qty}x ${itemId} to ${accountId}`);
        },
    },

    quit: {
        help: 'exit the REPL',
        run: () => shutdown(),
    },

    exit: {
        help: 'alias for quit',
        run: () => shutdown(),
    },
};

function shutdown(): void {
    gameController.pause();
    rl.close();
    process.exit(0);
}

async function dispatch(line: string): Promise<void> {
    const trimmed = line.trim();
    if (!trimmed) return;
    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    if (!cmd) {
        print(`unknown command: '${name}' — try 'help'`);
        return;
    }
    try {
        await cmd.run(args);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        print(`error: ${message}`);
    }
}

function banner(): void {
    print('');
    print('Guild headless console — type "help" for commands, "quit" to exit.');
    print('');
}

// --- entry ---------------------------------------------------------------

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'guild> ',
});

const argv = process.argv.slice(2);

if (argv.length > 0) {
    // Non-interactive: run one command and exit.
    dispatch(argv.join(' '))
        .then(() => {
            gameController.pause();
            process.exit(0);
        })
        .catch((err) => {
            print(`fatal: ${err instanceof Error ? err.message : String(err)}`);
            process.exit(1);
        });
} else {
    banner();
    rl.prompt();

    // Serialize command execution so long-running commands (e.g. `run 5`)
    // don't interleave with the next line the user types.
    let queue: Promise<void> = Promise.resolve();
    rl.on('line', (line) => {
        queue = queue.then(async () => {
            await dispatch(line);
            rl.prompt();
        });
    });
    rl.on('close', () => {
        // Wait for any in-flight command to finish before exiting so we
        // don't cut off a `run N` that's still awaiting its timer.
        queue.finally(() => {
            gameController.pause();
            process.exit(0);
        });
    });
}
