# City Market Feature

## Status

Spec complete, implementation pending. Branch: `feature/city-market`. Linear: [CQR-36](https://linear.app/cqr/issue/CQR-36/feature-city-market).

## Goal

Introduce a single city-wide **Market** building that acts as the canonical sink/source for goods. Production buildings (LumberMill, IronMine, BlackSmith) deliver output to the Market and receive money in return. Other buildings and adventurers can purchase goods from the Market. This is the first concrete step turning the production loop into an actual economy.

## Design decisions

- **Scope**: one `Market` building per city, owned by `City`.
- **Money**: each building and the Market keep their own `money` counters (no unified treasury yet).
- **Pricing**: static — `ItemRegistry[id].value` for both buy and sell sides. No spread, no dynamic pricing.
- **Directions**: sell (producer → market), buy (building/adventurer → market), and export (market → world sink). Export is synchronous and player-triggered in this iteration — the Market panel exposes a single "Export All Stock" button that converts stock into market treasury at `ItemRegistry.value * EXPORT_PRICE_MULTIPLIER`.
- **Delivery**: producer sell actions (`TransportAction`) delegate to `MarketService.sell`; worker travel ticks are preserved.
- **Buyers**: buildings via `BuyFromMarketAction` (travel ticks), adventurers directly (no tick cost).

## Architecture

```
src/
├── modules/market/
│   ├── common.ts            # Wallet interface, TradeRecord, error classes
│   ├── market.service.ts    # MarketService singleton (sell/buy/export)
│   └── market.console.ts    # INTENTIONAL GAP — autonomous decider stub
├── game/city/buildings/
│   ├── Market.ts            # Market extends BaseBuilding
│   └── actions/
│       └── BuyFromMarketAction.ts
└── components/buildings/
    └── MarketPanel.vue      # includes Export All Stock button
```

All goods movement goes through `TransactionService.createTransaction` / `commitTransaction`. `MarketService` never imports `BaseBuilding` or `Adventurer` directly — callers pass a `Wallet` adapter.

## Key interfaces

```typescript
// src/modules/market/common.ts
interface Wallet {
  get(): number;
  add(n: number): void; // throws MarketInsufficientFundsError if would go negative
}

type TradeRecord = {
  tick: number;
  side: 'buy' | 'sell' | 'export';
  counterpartyId: string;
  items: Map<ItemID, number>;
  total: number;
};
```

```typescript
// src/modules/market/market.service.ts (singleton)
marketService.getStock(): Map<ItemID, number>
marketService.getPrice(id: ItemID): number
marketService.sell(sellerId, sellerWallet, items): void
marketService.buy(buyerId, buyerWallet, items): void
marketService.export(items: Map<ItemID, number>): void
marketService.exportAll(): void
marketService.getExportQuote(items?: Map<ItemID, number>): number
marketService.recentTrades: TradeRecord[]  // ring buffer, cap 20
```

`export` validates stock, routes goods to a write-only `market:export` sink
account via `TransactionService`, credits the market treasury by
`getExportQuote(items)`, and pushes an `'export'` `TradeRecord` with
`counterpartyId: 'world'`. `exportAll` snapshots `getStock()` and delegates.
`getExportQuote` is the single source of truth for the multiplier math so
the UI label and the actual treasury delta cannot disagree. Non-stackable
items are skipped with a warn log (the market never holds instances today).

## Files changed from prior spec

| File | Change |
|------|--------|
| `src/modules/inventory/inventory.repository.ts` | Fix `validateLedger` forEach early-return bug |
| `src/modules/inventory/common.ts` | Add `'market'` to `BuildingID`/`InventoryID` |
| `src/game/city/City.ts` | Instantiate Market, call `marketService.init` |
| `src/game/city/buildings/common/Action.ts` | `TransportAction.finished()` → `MarketService.sell` |
| `src/game/city/buildings/BlackSmith.ts` | Add `BuyFromMarketAction` branch |
| `src/components/left-menu/BuildingsList.vue` | Add Market entry |
| `src/App.vue` | Wire Market panel + reactive wrapping |
| `src/game/adventurer/Adventurer.ts` | Add temporary `buyFromMarket`/`sellToMarket` methods |

## Error handling

- `MarketInsufficientFundsError` — thrown when Market cannot pay a seller, or a buyer cannot cover the total. No partial mutations.
- `MarketInsufficientStockError` — thrown when Market stock is insufficient for a buy. No partial mutations.
- All errors caught at the action level (`TransportAction`, `BuyFromMarketAction`) and logged as warnings so the game loop never crashes.

## Known gaps / out of scope for this iteration

- **Autonomous market export (`market.console.ts` gap).** `Market.chooseNextAction()` still returns `WaitAction`. The `marketConsole.decide(market)` stub in `src/modules/market/market.console.ts` is where the autonomous export policy will live (e.g. export when `stock.value > threshold` and `treasury < floor`, or on a cadence). For now, only the player can trigger exports, via the MarketPanel button. Nothing imports `market.console.ts` yet; calling `decide()` throws `ToBeImplemented`. This file was originally planned as `src/console.ts` but that path is already the headless REPL harness, so the gap moved into the market module.
- **Export price multiplier is neutral.** `EXPORT_PRICE_MULTIPLIER` in `market.service.ts` defaults to `1.0`, meaning export exactly refunds what the market paid producers — it prevents bankruptcy but does not let the market fund structural growth. A real balance pass should tune this below 1.0 in combination with a producer sell price also below 1.0 of buyer cost to create a true spread. Held at 1.0 until there is data to tune against.
- **Export sink is a memory leak.** The `market:export` destination account is write-only and never garbage-collected. Acceptable at prototype scale; a real caravan/trade entity (or a dedicated `takeGoods`-only path on the repository) would replace it.
- **Per-row export with quantity selector.** The MarketPanel exposes one "Export All Stock" button; a finer affordance (per-good row, quantity field) is explicitly out of scope here. Do not rescope into this iteration.
- Dynamic supply/demand pricing, buy/sell spread.
- Persistence of trade history across reload.
- Market UI polish (charts, filters, pagination).
- Per-good stock policies, market workers, transport time for the Market itself.
- Migrating per-building wallets to a unified city treasury.
- Equipment (non-stackable) buy/sell and export through the Market.

## Relation to buildings-economy spec

This feature supersedes the `TransportAction → building.money` sell flow described in `.specs/features/buildings-economy/README.md`. That spec's "Known implementation gaps" item — *"Sales currently increase `building.money`, while the visible header shows `city.money`"* — is now addressed by routing all sales through a real Market counterparty. The buildings-economy spec remains accurate for everything else (worker/action lifecycle, production recipes, goods catalog).
