import { BaseBuilding, BuildingID } from './common/Building.ts';
import { WaitAction } from './common/Action.ts';
import { InventoryAccountService } from '../../../modules/inventory/inventory.service.ts';
import type { Action } from './common/Action.ts';

console.log(`[AdventurersGuild] Loaded`);

const GUILD_INITIAL_MONEY = 100;

/**
 * The building where quests are posted and adventurers will register.
 *
 * It owns neither. The board lives in `questService` (ADR 0002) and this is a
 * thin shell over it — exactly the relationship `Market` has with
 * `marketService`. The guild is where the two meet, nothing more, which is why
 * it holds no state of its own.
 *
 * Named `AdventurersGuild`, not `Guild` or `GuildHall`: the project itself is
 * called Guild, and the shorter names are permanently ambiguous in prose,
 * commits and paths.
 *
 * No workers — an established shape, since `Market` already runs with an empty
 * worker list and a wait action.
 */
export class AdventurersGuild extends BaseBuilding {
    static name = "Adventurers' Guild";
    static building_id = BuildingID.AdventurersGuild;

    public level = 1;
    public money = GUILD_INITIAL_MONEY;

    constructor() {
        super();
        this.inventory = InventoryAccountService.init(BuildingID.AdventurersGuild);
        this.workers = [];
        console.log(`[AdventurersGuild] OK`);
    }

    protected chooseNextAction(): Action {
        // Never reached — `handleTick` only chooses for available workers and
        // this building has none. Present because `BaseBuilding` requires it.
        return new WaitAction();
    }
}
