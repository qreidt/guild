import { Action, ActionStatus } from '../common/Action.ts';
import type { BaseBuilding } from '../common/Building.ts';
import type { ItemID } from '../../../../modules/items/id.ts';
import marketService from '../../../../modules/market/market.service.ts';
import { MarketInsufficientFundsError, MarketInsufficientStockError, type Wallet } from '../../../../modules/market/common.ts';

export class BuyFromMarketAction extends Action {
    static name = 'BuyFromMarket';
    static building_id = null;

    public total_ticks: number;
    private readonly building: BaseBuilding;
    private readonly items: Map<ItemID, number>;

    constructor(building: BaseBuilding, items: Map<ItemID, number>, ticks: number) {
        super();
        this.building = building;
        this.items = items;
        this.total_ticks = ticks;
    }

    /** Override: no pre-deduction from buyer; market handles it atomically in finished(). */
    public start(): void {
        this.status = ActionStatus.ACTIVE;
        this.ticks_remaining = this.total_ticks;
        this.started();
    }

    protected finished(): void {
        const wallet: Wallet = {
            get: () => this.building.money,
            add: (n: number) => { this.building.money += n; },
        };
        try {
            marketService.buy(this.building.id, wallet, this.items);
            console.debug(`[BuyFromMarketAction] ${this.building.id} bought from market.`);
        } catch (e) {
            if (e instanceof MarketInsufficientFundsError) {
                console.warn(`[BuyFromMarketAction] Insufficient funds: ${e.message}`);
            } else if (e instanceof MarketInsufficientStockError) {
                console.warn(`[BuyFromMarketAction] Insufficient stock: ${e.message}`);
            } else {
                throw e;
            }
        }
    }
}
