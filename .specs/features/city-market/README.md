# City Market Feature

## Status

Spec complete, implementation pending. Branch: `feature/city-market`. Linear: [CQR-36](https://linear.app/cqr/issue/CQR-36/feature-city-market).

## Goal

Introduce a single city-wide **Market** building that acts as the canonical sink/source for goods. Production buildings (LumberMill, IronMine, BlackSmith) deliver output to the Market and receive money in return. Other buildings and adventurers can purchase goods from the Market. This is the first concrete step turning the production loop into an actual economy.

## Design decisions

- **Scope**: one `Market` building per city, owned by `City`.
- **Money**: each building and the Market keep their own `money` counters (no unified treasury yet).
- **Pricing**: static — `ItemRegistry[id].value` for both buy and sell sides. No spread, no dynamic pricing.
- **Directions**: sell (producer → market) and buy (building/adventurer → market).
- **Delivery**: producer sell actions (`TransportAction`) delegate to `MarketService.sell`; worker travel ticks are preserved.
- **Buyers**: buildings via `BuyFromMarketAction` (travel ticks), adventurers directly (no tick cost).

## Architecture

```
src/
├── modules/market/
│   ├── common.ts            # Wallet interface, TradeRecord, error classes
│   └── market.service.ts    # MarketService singleton
├── game/city/buildings/
│   ├── Market.ts            # Market extends BaseBuilding
│   └── actions/
│       └── BuyFromMarketAction.ts
└── components/buildings/
    └── MarketPanel.vue
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
  side: 'buy' | 'sell';
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
marketService.recentTrades: TradeRecord[]  // ring buffer, cap 20
```

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

- Dynamic supply/demand pricing, buy/sell spread.
- Persistence of trade history across reload.
- Market UI polish (charts, filters, pagination).
- Per-good stock policies, market workers, transport time for the Market itself.
- Migrating per-building wallets to a unified city treasury.
- Equipment (non-stackable) buy/sell through the Market.

## Relation to buildings-economy spec

This feature supersedes the `TransportAction → building.money` sell flow described in `.specs/features/buildings-economy/README.md`. That spec's "Known implementation gaps" item — *"Sales currently increase `building.money`, while the visible header shows `city.money`"* — is now addressed by routing all sales through a real Market counterparty. The buildings-economy spec remains accurate for everything else (worker/action lifecycle, production recipes, goods catalog).
