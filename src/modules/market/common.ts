import type { ItemID } from '../items/id.ts';

export interface Wallet {
    get(): number;
    add(n: number): void;
}

export type TradeRecord = {
    tick: number;
    side: 'buy' | 'sell';
    counterpartyId: string;
    items: Map<ItemID, number>;
    total: number;
};

export class MarketInsufficientFundsError extends Error {
    constructor(message: string = 'Insufficient funds') {
        super(message);
        this.name = 'MarketInsufficientFundsError';
    }
}

export class MarketInsufficientStockError extends Error {
    constructor(message: string = 'Insufficient stock') {
        super(message);
        this.name = 'MarketInsufficientStockError';
    }
}
