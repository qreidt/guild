import { ToBeImplemented } from '../../exceptions/ToBeImplemented.ts';
import type { Action } from '../../game/city/buildings/common/Action.ts';
import type { Market } from '../../game/city/buildings/Market.ts';

/**
 * Market Console — intentional gap.
 *
 * Placeholder for the Market's autonomous decision-maker. Today the Market
 * is a passive counterparty: producers sell into it, the BlackSmith buys
 * from it, and the player triggers exports manually from the MarketPanel.
 * Eventually the Market should decide on its own when to return an
 * autonomous action (e.g. an ExportAction) from `Market.chooseNextAction()`.
 *
 * Responsibility of `marketConsole.decide(market)` once implemented:
 *   - read market stock and treasury
 *   - inspect recent trade history (marketService.recentTrades)
 *   - pick a policy (e.g. export when stock value > threshold and
 *     treasury < floor, or on a cadence)
 *   - return the Action to run this tick, or null to wait
 *
 * Nothing imports this file yet — calling `marketConsole.decide(market)`
 * from anywhere will throw `ToBeImplemented`.
 *
 * TODO: see `.specs/features/city-market/README.md` → "Autonomous market
 * export" for the policy discussion and design notes.
 *
 * NOTE on naming: this was originally planned as `src/console.ts`, but
 * that path is already taken by the headless REPL harness. It lives here,
 * colocated with the rest of the market module, to preserve the "isolated
 * gap file" intent.
 */
class MarketConsole {
    public decide(_market: Market): Action | null {
        throw new ToBeImplemented('marketConsole.decide');
    }
}

export const marketConsole = new MarketConsole();
