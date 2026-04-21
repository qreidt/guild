import { BaseBuilding, BuildingID } from './common/Building.ts';
import { WaitAction } from './common/Action.ts';
import { InventoryAccountService } from '../../../modules/inventory/inventory.service.ts';
import type { Action } from './common/Action.ts';

console.log(`[Market] Loaded`);

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
        console.log(`[Market] OK`);
    }

    protected chooseNextAction(): Action {
        // TODO: Autonomous market export lives in
        // `src/modules/market/market.console.ts` (marketConsole.decide).
        // For now exports are player-triggered from MarketPanel; this method
        // intentionally stays a no-op. See `.specs/features/city-market/README.md`
        // → "Autonomous market export" for the policy discussion.
        return new WaitAction();
    }
}
