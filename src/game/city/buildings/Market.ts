import { BaseBuilding, BuildingID } from './common/Building.ts';
import { WaitAction } from './common/Action.ts';
import { InventoryAccountService } from '../../../modules/inventory/inventory.service.ts';
import type { Action } from './common/Action.ts';

const MARKET_INITIAL_MONEY = 1000;

export class Market extends BaseBuilding {
    static name = 'Market';
    static building_id = BuildingID.Market;

    public level = 1;
    public money = MARKET_INITIAL_MONEY;

    constructor() {
        super();
        this.inventory = InventoryAccountService.init(BuildingID.Market);
        this.workers = [];
    }

    protected chooseNextAction(): Action {
        // Exports are player-triggered from MarketPanel; the Market takes no autonomous action yet.
        return new WaitAction();
    }
}
