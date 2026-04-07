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
