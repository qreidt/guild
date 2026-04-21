import { ItemRegistry } from '../items/registry.ts';
import type { ItemID } from '../items/id.ts';
import transactionService from '../inventory/transaction.service.ts';
import inventoryRepository from '../inventory/inventory.repository.ts';
import { BuildingID } from '../../game/city/buildings/common/Building.ts';
import gameController from '../../game/controllers/GameController.ts';
import {
    MarketInsufficientFundsError,
    MarketInsufficientStockError,
    type TradeRecord,
    type Wallet,
} from './common.ts';
import type { Market } from '../../game/city/buildings/Market.ts';

const TRADE_RING_BUFFER_CAP = 20;

// Tunable: <1.0 creates a real market spread (market recovers less than it paid).
// 1.0 is neutral — export exactly refunds the cost of the stock at registry value.
const EXPORT_PRICE_MULTIPLIER = 1.0;

// Write-only inventory account used as the destination for exported goods.
// Nothing ever reads from it; it is an accepted in-memory leak at prototype scale.
// A real caravan/trade entity would replace this sink later.
const EXPORT_SINK_ID = 'market:export';

class MarketService {
    private market: Market | null = null;

    public readonly recentTrades: TradeRecord[] = [];

    public init(market: Market): void {
        this.market = market;
    }

    public getStock(): Map<ItemID, number> {
        return this.market!.inventory.getCountByGoodId();
    }

    public getPrice(itemId: ItemID): number {
        return ItemRegistry[itemId].value;
    }

    /**
     * Sell items from a seller to the market.
     * Goods move from sellerId's inventory to market's inventory.
     * Market pays the seller.
     */
    public sell(sellerId: string, sellerWallet: Wallet, items: Map<ItemID, number>): void {
        const total = this.computeTotal(items);

        if (this.market!.money < total) {
            throw new MarketInsufficientFundsError(
                `Market cannot pay ${total}g to seller '${sellerId}' (has ${this.market!.money}g)`
            );
        }

        const txId = transactionService.createTransaction(
            sellerId,
            BuildingID.Market,
            { stacks: items },
            { stacks: items },
        );
        transactionService.commitTransaction(txId);

        this.market!.money -= total;
        sellerWallet.add(total);

        this.pushTrade({
            tick: gameController.tick,
            side: 'sell',
            counterpartyId: sellerId,
            items,
            total,
        });
    }

    /**
     * Buy items from the market for a buyer.
     * Goods move from market's inventory to buyerId's inventory.
     * Buyer pays the market.
     */
    public buy(buyerId: string, buyerWallet: Wallet, items: Map<ItemID, number>): void {
        if (!inventoryRepository.validateLedger(BuildingID.Market, items)) {
            throw new MarketInsufficientStockError(
                `Market has insufficient stock for buyer '${buyerId}'`
            );
        }

        const total = this.computeTotal(items);

        if (buyerWallet.get() < total) {
            throw new MarketInsufficientFundsError(
                `Buyer '${buyerId}' cannot pay ${total}g (has ${buyerWallet.get()}g)`
            );
        }

        const txId = transactionService.createTransaction(
            BuildingID.Market,
            buyerId,
            { stacks: items },
            { stacks: items },
        );
        transactionService.commitTransaction(txId);

        buyerWallet.add(-total);
        this.market!.money += total;

        this.pushTrade({
            tick: gameController.tick,
            side: 'buy',
            counterpartyId: buyerId,
            items,
            total,
        });
    }

    /**
     * Export items out of the world for gold.
     * Goods move from the Market's inventory to a write-only sink account,
     * and the Market's treasury is credited with the quoted price.
     *
     * This is the third trade direction (sell, buy, export) and is the main
     * lever that keeps the market economy solvent — producers sell into the
     * market, and export converts piled-up stock back into liquidity.
     *
     * Non-stackable items (equipment) are silently skipped: the market does
     * not currently hold any, and instance-level transactions are not
     * implemented in the transaction service yet.
     */
    public export(items: Map<ItemID, number>): void {
        const exportable = new Map<ItemID, number>();
        for (const [itemId, qty] of items) {
            if (qty <= 0) continue;
            if (!ItemRegistry[itemId].stackable) {
                console.warn(`[MarketService] Skipping non-stackable item '${itemId}' in export`);
                continue;
            }
            exportable.set(itemId, qty);
        }

        if (exportable.size === 0) return;

        if (!inventoryRepository.validateLedger(BuildingID.Market, exportable)) {
            throw new MarketInsufficientStockError(
                `Market has insufficient stock for export`
            );
        }

        const total = this.getExportQuote(exportable);

        const txId = transactionService.createTransaction(
            BuildingID.Market,
            EXPORT_SINK_ID,
            { stacks: exportable },
            { stacks: exportable },
        );
        transactionService.commitTransaction(txId);

        this.market!.money += total;

        this.pushTrade({
            tick: gameController.tick,
            side: 'export',
            counterpartyId: 'world',
            items: exportable,
            total,
        });
    }

    /**
     * Export the market's entire current stock in one shot.
     * Snapshots the stock map first so we don't mutate the live inventory
     * while iterating.
     */
    public exportAll(): void {
        const snapshot = new Map(this.getStock());
        this.export(snapshot);
    }

    /**
     * How much gold the market would receive by exporting the given items.
     * Defaults to the current full stock. Single source of truth for the
     * multiplier math so UI and service cannot disagree.
     */
    public getExportQuote(items?: Map<ItemID, number>): number {
        const target = items ?? this.getStock();
        return Math.floor(this.computeTotal(target) * EXPORT_PRICE_MULTIPLIER);
    }

    private computeTotal(items: Map<ItemID, number>): number {
        let total = 0;
        for (const [itemId, qty] of items) {
            total += ItemRegistry[itemId].value * qty;
        }
        return total;
    }

    private pushTrade(record: TradeRecord): void {
        if (this.recentTrades.length >= TRADE_RING_BUFFER_CAP) {
            this.recentTrades.shift();
        }
        this.recentTrades.push(record);
    }
}

export default new MarketService();
