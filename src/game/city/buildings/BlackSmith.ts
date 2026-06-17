import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Worker} from "./common/Worker.ts";
import {Action, WaitAction} from "./common/Action.ts";
import {InventoryAccountService} from "../../../modules/inventory/inventory.service.ts";
import {ItemID} from "../../../modules/items/id.ts";
import inventoryRepository from "../../../modules/inventory/inventory.repository.ts";
import {BuyFromMarketAction} from "./actions/BuyFromMarketAction.ts";
import marketService from "../../../modules/market/market.service.ts";

console.log(`[BlackSmith] Loaded`);

export class BlackSmith extends BaseBuilding {
    level = 1;
    money = 100;

    static building_id = BuildingID.BlackSmith;

    public inventory: InventoryAccountService = InventoryAccountService.init(
        BuildingID.BlackSmith, {
            stacks: new Map([
                [ItemID.IronOre, 400],
            ]),
        });

    constructor() {
        super();

        this.setup();
        this.workers = [
            new Worker(),
            new Worker(),
        ];

        console.log(`[BlackSmith] OK`);
    }

    protected chooseNextAction(): Action {
        const ironOreCount = this.inventory.getCount(ItemID.IronOre);
        const ORE_BUY_THRESHOLD = 80;
        const ORE_BUY_BATCH = 80;
        const orePrice = marketService.getPrice(ItemID.IronOre);
        if (ironOreCount < ORE_BUY_THRESHOLD && this.money >= orePrice * ORE_BUY_BATCH) {
            return new BuyFromMarketAction(this, new Map([[ItemID.IronOre, ORE_BUY_BATCH]]), 14);
        }

        const list = this.inventory.getCountByGoodId();

        const make_ingot_action = new MakeIngotAction();
        const can_make_ingot = make_ingot_action.validateInput();

        // map ordered by priority with a minimum amount of each item
        const production_list = {
            [ItemID.IronSword]:    {desired_amount: 12, action: MakeIronSwordAction},
            [ItemID.IronShield]:   {desired_amount:  8, action: MakeIronShieldAction},
            [ItemID.IronHelmet]:   {desired_amount:  6, action: MakeIronHelmetAction},
            [ItemID.IronPlate]:    {desired_amount:  4, action: MakeIronPlateAction},
            [ItemID.IronMail]:     {desired_amount:  4, action: MakeIronMailAction},
            [ItemID.IronPants]:    {desired_amount:  8, action: MakeIronPantsAction},
            [ItemID.IronBoots]:    {desired_amount:  8, action: MakeIronBootsAction},
            [ItemID.IronGauntlet]: {desired_amount:  8, action: MakeIronGauntletAction},
            [ItemID.IronSpear]:    {desired_amount:  4, action: MakeIronSpearAction},
        };

        // any item with count below a minimum amount
        for (const [item_id, recipe] of Object.entries(production_list)) {
            const current_amount = list.get(item_id as ItemID) ?? 0;
            const action = new recipe.action();

            if (current_amount < recipe.desired_amount) {
                if (! this.inventory.validateLedger(action.input!)) {
                    if (can_make_ingot) {
                        return make_ingot_action;
                    }

                    continue;
                }

                return action;
            }
        }

        if (this.inventory.getCount(ItemID.IronOre) >= 2) {
            return new MakeIngotAction();
        }

        return new WaitAction();
    }
}

class MakeIngotAction extends Action {
    static name = 'MakeIngot';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 2; // 1h

    static input_origin = BuildingID.BlackSmith;
    input = new Map([
        [ItemID.IronOre, 2],
    ]);

    static output_destination = BuildingID.BlackSmith;
    static output = new Map([
        [ItemID.IronIngot, 1],
    ]);

    protected finished() {
        inventoryRepository.putGood(
            this.static.building_id!,
            ItemID.IronIngot, 1
        );
        console.debug('Blacksmith melted an Iron Ingot.');
    }
}

class MakeIronSwordAction extends Action {
    static name = 'MakeIronSword';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    good_id = ItemID.IronSword;

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 2]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronSword, 1]])
}

class MakeIronShieldAction extends Action {
    static name = 'MakeIronShield';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 4]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronShield, 1]])
}

class MakeIronHelmetAction extends Action {
    static name = 'MakeIronHelmet';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 2]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronHelmet, 1]])
}

class MakeIronPlateAction extends Action {
    static name = 'MakeIronPlate';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 6]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronPlate, 1]])
}

class MakeIronMailAction extends Action {
    static name = 'MakeIronMail';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 3]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronMail, 1]])
}

class MakeIronPantsAction extends Action {
    static name = 'MakeIronPants';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 4]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronPants, 1]])
}

class MakeIronBootsAction extends Action {
    static name = 'MakeIronBoots';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 2]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronBoots, 1]])
}

class MakeIronGauntletAction extends Action {
    static name = 'MakeIronGauntlet';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 2]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronGauntlet, 1]])
}

class MakeIronSpearAction extends Action {
    static name = 'MakeIronSpear';
    static building_id = BuildingID.BlackSmith;
    total_ticks = 8; // 4 hours

    static input_origin = BuildingID.BlackSmith;
    input = new Map([[ItemID.IronIngot, 1]]);

    output_destination = BuildingID.BlackSmith;
    output = new Map([[ItemID.IronSpear, 1]])
}
