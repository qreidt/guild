# Requirements Document

## Introduction

The City Market is the first economy-completing feature for Guild. After the recent Inventory & Items refactor (`7fa92c4`), production buildings (LumberMill, IronMine, BlackSmith) generate goods and "sell" them via `TransportAction.finished()`, which simply credits `building.money` at `ItemRegistry[id].value` against no real buyer. There is no shared marketplace, no way for one actor to acquire goods it doesn't produce, and no UI surface for trade.

This feature introduces a single city-wide **Market** building that becomes the canonical sink/source for goods. Producers transfer their output into the Market (and receive money in return); other buildings and adventurers can purchase from the Market's stock. Pricing uses the static `ItemRegistry[id].value` for both sides; no spread or dynamic pricing in this iteration.

## Alignment with Product Vision

Guild's economic loop (raw resources → goods → equipment → revenue) currently has a missing middle: buildings convert items to money in isolation, and there is no shared place for actors to trade. Per `.specs/features/buildings-economy/README.md`, the buildings layer was always intended to feed into a market-driven economy. This feature delivers the minimum viable market: a real entity with stock, a wallet, and trade APIs that flow through the existing transaction primitives — unblocking later work on dynamic pricing, multi-city trade, and adventurer commerce.

## Requirements

### Requirement 1 — Market entity

**User Story:** As a player, I want a Market building in my city, so that there is a single visible place where goods are bought and sold.

#### Acceptance Criteria

1. WHEN the City is constructed THEN the system SHALL instantiate exactly one `Market` extending `BaseBuilding` and register it in `City.buildings`.
2. WHEN the Market is created THEN the system SHALL provision an `InventoryAccountService` keyed by a new `BuildingID.Market` and a `money` balance initialised from a configurable constant (default `1000`).
3. WHEN the game tick runs THEN the Market SHALL participate in `City.handleTick` like any other building (no special-casing) and its `chooseNextAction()` SHALL return a `WaitAction` (no autonomous behaviour in this iteration).

### Requirement 2 — Sell flow (producer → Market)

**User Story:** As a production building, I want to sell my output to the Market, so that I convert goods to money against a real counterparty.

#### Acceptance Criteria

1. WHEN `LumberMill.SellWoodAction`, `IronMine.SellOres`, or any other producer sell action finishes THEN the system SHALL settle the trade through `MarketService.sell(sellerId, items)` rather than mutating `building.money` directly in `TransportAction.finished()`.
2. WHEN `MarketService.sell` is invoked THEN the system SHALL transfer the goods from the seller's inventory account into the Market's inventory account via `TransactionService.createTransaction` + `commitTransaction`.
3. WHEN the goods transfer commits THEN the system SHALL debit `Market.money` and credit the seller's `money` by `Σ items[id] × ItemRegistry[id].value`.
4. IF `Market.money` is insufficient to cover the total THEN the system SHALL abort the transaction before commit, leave both accounts unchanged, and throw `MarketInsufficientFundsError`.
5. WHEN a sell settles THEN the system SHALL append a `TradeRecord { tick, side: 'sell', counterparty, items, total }` to a bounded ring buffer (`recentTrades`, capacity ≥ 20).

### Requirement 3 — Buy flow (building/adventurer → Market)

**User Story:** As a building or adventurer, I want to buy goods from the Market, so that I can source items I don't produce myself.

#### Acceptance Criteria

1. WHEN `MarketService.buy(buyerId, items)` is invoked THEN the system SHALL validate that the Market holds the requested goods and that the buyer's wallet holds at least `Σ items[id] × ItemRegistry[id].value`.
2. IF Market stock is insufficient THEN the system SHALL throw `MarketInsufficientStockError` and leave both accounts unchanged.
3. IF the buyer's wallet is insufficient THEN the system SHALL throw `MarketInsufficientFundsError` and leave both accounts unchanged.
4. WHEN both sides validate THEN the system SHALL transfer the goods from Market inventory to the buyer's inventory via the transaction pipeline AND debit the buyer's wallet / credit `Market.money` atomically with the goods transfer.
5. WHEN a building buys from the Market THEN the system SHALL route the purchase through a new `BuyFromMarketAction` (mirroring `TransportAction`) so that worker travel ticks are still consumed.
6. WHEN the BlackSmith's IronOre stock is below a configurable threshold AND `BlackSmith.money` is sufficient for at least one batch THEN `BlackSmith.chooseNextAction()` MAY return a `BuyFromMarketAction(IronOre, batchSize)`.
7. WHEN an adventurer buys from the Market THEN the system SHALL settle synchronously without any action/tick cost (adventurer trade UX is out of scope).

### Requirement 4 — Pricing & Wallet abstraction

**User Story:** As a developer, I want a single price source and a wallet abstraction, so that the Market does not couple to entity types.

#### Acceptance Criteria

1. WHEN any market operation needs a price THEN the system SHALL read it from `MarketService.getPrice(itemId)`, which SHALL return `ItemRegistry[itemId].value`.
2. WHEN `MarketService` settles money against a buyer or seller THEN it SHALL use a `Wallet { get(): number; add(n: number): void }` adapter passed in by the caller, NOT a direct reference to `BaseBuilding` or `Adventurer`.
3. WHEN the Wallet adapter cannot satisfy `add(-n)` (i.e. would go negative) THEN it SHALL throw before any inventory mutation occurs.

### Requirement 5 — UI surface

**User Story:** As a player, I want to see Market stock, prices, and recent trades, so that I can understand and interact with the economy.

#### Acceptance Criteria

1. WHEN the left-menu `BuildingsList.vue` is rendered THEN the Market SHALL appear as an entry alongside the other buildings.
2. WHEN the player selects the Market THEN the system SHALL display a `MarketPanel.vue` showing: current stock per item, the price per item from `MarketService.getPrice`, the Market's current money, and the most recent trades from `recentTrades`.
3. WHEN trades occur during the game loop THEN the panel SHALL reactively update without manual refresh (using the existing `reactive(...)` pattern from `App.vue`).
4. WHEN the player opens an Adventurer view THEN a temporary "Buy / Sell" control SHALL be exposed that calls `MarketService.buy`/`sell` for manual verification (this control is explicitly a test affordance, not final UX).

### Requirement 6 — Inventory ledger correctness

**User Story:** As a developer, I want `validateLedger` to actually short-circuit on missing goods, so that the Market's validation guarantees hold.

#### Acceptance Criteria

1. WHEN `InventoryRepository.validateLedger` evaluates a required ledger THEN the system SHALL return `false` as soon as any required item exceeds the account's current count (the existing `forEach` early-return bug noted in `.specs/architecture.md:137` SHALL be fixed).
2. WHEN this validation underpins a `MarketService.buy` or `sell` call AND validation returns `false` THEN no transaction SHALL be created.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility**: `MarketService` handles trade orchestration only; `Market` (the building) only owns inventory + wallet + lifecycle. UI lives in its own SFC.
- **Reuse over reinvention**: All goods movement MUST go through `TransactionService.createTransaction` / `commitTransaction`. No direct mutation of `InventoryRepository` accounts from market code.
- **Decoupling**: `MarketService` MUST NOT import `BaseBuilding` or `Adventurer` directly. Wallet access goes through the `Wallet` adapter.
- **Clear interfaces**: `MarketService` exposes `getStock`, `getPrice`, `sell`, `buy`, `recentTrades`. Errors are typed (`MarketInsufficientStockError`, `MarketInsufficientFundsError`).

### Performance
- Trade ring buffer capped at ~20 entries to keep render cost trivial.
- Market participates in `City.handleTick` but performs no autonomous work in this iteration, so per-tick cost is O(1).

### Security
- Not applicable (single-player, client-side, no untrusted input).

### Reliability
- All settlement paths MUST be atomic with respect to the transaction pipeline: either both inventory and wallet update, or neither does. Partial mutations are not acceptable and MUST be covered by manual verification before merge.
- Typed errors MUST be thrown — never silent failures — so callers (and the BlackSmith decision branch) can react.

### Usability
- Market panel MUST be discoverable from the existing BuildingsList (no hidden menu).
- Stock, prices, money and trade history MUST update reactively — no manual refresh needed during the game loop.
