import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Worker} from "./common/Worker.ts";
import {Action, WaitAction} from "./common/Action.ts";
import {InventoryAccountService} from "../../../modules/inventory/inventory.service.ts";
import {ItemID} from "../../../modules/items/id.ts";

console.log(`[Apothecary] Loaded`);

/**
 * The first building whose input does NOT come from itself. The LumberMill and
 * IronMine conjure their inputs from nothing; the Apothecary brews foraged herbs
 * that will eventually arrive with returning adventurers. Until then the supply
 * is a seeded stack, so it runs down and stops — which is why every returned
 * action must have validated input (see chooseNextAction).
 *
 * It never sells: potions accumulate here with no TransportAction and no market
 * line, so `money` is fixed at its starting value.
 */
export class Apothecary extends BaseBuilding {
    level = 1;
    money = 100;

    static building_id = BuildingID.Apothecary;

    public inventory: InventoryAccountService = InventoryAccountService.init(
        BuildingID.Apothecary, {
            stacks: new Map([
                [ItemID.Bloodroot, 10],
                [ItemID.Manabloom, 10],
            ]),
        });

    constructor() {
        super();

        this.setup();
        this.workers = [
            new Worker(),
            new Worker(),
        ];

        console.log(`[Apothecary] OK`);
    }

    protected chooseNextAction(): Action {
        const list = this.inventory.getCountByGoodId();

        // map ordered by priority with a minimum amount of each item
        const production_list = {
            [ItemID.HealthPotion]: {desired_amount: 3, action: BrewHealthPotionAction},
            [ItemID.ManaPotion]:   {desired_amount: 3, action: BrewManaPotionAction},
        };

        for (const [item_id, recipe] of Object.entries(production_list)) {
            const current_amount = list.get(item_id as ItemID) ?? 0;
            if (current_amount >= recipe.desired_amount) continue;

            const action = new recipe.action();

            // Load-bearing: Action.start() calls createTransaction(), which THROWS
            // on insufficient contents, and nothing catches it up through
            // handleTick -> City.handleTick -> nextTick — the tick loop would die.
            // Workers are served one at a time inside the same handleTick loop, so
            // worker A's start() has already debited the ledger by the time worker
            // B gets here; this branch is reached, not theoretical.
            if (! this.inventory.validateLedger(action.input!)) continue;

            return action;
        }

        return new WaitAction();
    }
}

/**
 * `output` / `output_destination` are INSTANCE properties on purpose. `Action`
 * declares `public output = null`, so a `static output` (as MakeIngotAction does)
 * leaves the instance null, the transaction carries nothing, and the herbs are
 * consumed for no potion. MakeIronSwordAction is the shape to copy.
 */
class BrewHealthPotionAction extends Action {
    static name = 'BrewHealthPotion';
    static building_id = BuildingID.Apothecary;
    total_ticks = 12; // 6 hours

    static input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Bloodroot, 3]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.HealthPotion, 1]])
}

class BrewManaPotionAction extends Action {
    static name = 'BrewManaPotion';
    static building_id = BuildingID.Apothecary;
    total_ticks = 12; // 6 hours

    static input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Manabloom, 3]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.ManaPotion, 1]])
}
