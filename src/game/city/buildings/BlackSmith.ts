import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {GoodID} from "../../common/Good.ts";
import {Worker} from "./common/Worker.ts";
import {Action, WaitAction} from "./common/Action.ts";
import InventoryService from "../../../modules/inventory/inventory.service.ts";


export class BlackSmith extends BaseBuilding {
    level = 1;
    money = 100;

    constructor() {
        super();
        this.workers = [
            new Worker(),
            new Worker(),
        ];

        InventoryService.put(
            BuildingID.BlackSmith,
            {
                goods: new Map([
                    [GoodID.IronOre, 400],
                    [GoodID.IronSword, 1],
                ])
            }
        );
    }

    protected chooseNextAction(): Action {
        const list = InventoryService.getCountByGoodId(BuildingID.BlackSmith);

        const make_ingot_action = new MakeIngotAction();
        const can_make_ingot = make_ingot_action.validateInput();

        // map ordered by priority with a minimum amount of each item
        const production_list = {
            [GoodID.IronSword]:    {desired_amount: 12, action: MakeIronSwordAction},
            [GoodID.IronShield]:   {desired_amount:  8, action: MakeIronShieldAction},
            [GoodID.IronHelmet]:   {desired_amount:  6, action: MakeIronHelmetAction},
            [GoodID.IronPlate]:    {desired_amount:  4, action: MakeIronPlateAction},
            [GoodID.IronMail]:     {desired_amount:  4, action: MakeIronMailAction},
            [GoodID.IronPants]:    {desired_amount:  8, action: MakeIronPantsAction},
            [GoodID.IronBoots]:    {desired_amount:  8, action: MakeIronBootsAction},
            [GoodID.IronGauntlet]: {desired_amount:  8, action: MakeIronGauntletAction},
            [GoodID.IronSpear]:    {desired_amount:  4, action: MakeIronSpearAction},
        };

        // any item with count below a minimum amount
        for (const [good_id, recipe] of Object.entries(production_list)) {
            const current_amount = list.get(good_id as GoodID) ?? 0;
            const action = new recipe.action();

            if (current_amount < recipe.desired_amount) {
                if (! InventoryService.validateLedger(BuildingID.BlackSmith, action.action_input)) {
                    if (can_make_ingot) {
                        return make_ingot_action;
                    }

                    continue;
                }

                return action;
            }
        }

        if (InventoryService.getCount(BuildingID.BlackSmith, GoodID.IronOre) >= 2) {
            return new MakeIngotAction();
        }

        return new WaitAction(BuildingID.BlackSmith);
    }
}

class MakeIngotAction extends Action {
    total_ticks = 2; // 1h
    building_id = BuildingID.BlackSmith;

    action_input = new Map([
        [GoodID.IronOre, 2],
    ]);

    protected finished() {
        InventoryService.putGood(BuildingID.BlackSmith, GoodID.IronIngot, 1);
        console.debug('Blacksmith melted an Iron Ingot.');
    }
}

abstract class BaseMakeAction extends Action {

    abstract good_id: GoodID;
    abstract total_ticks: number;
    amount: number = 1;

    protected finished() {
        InventoryService.putGood(BuildingID.BlackSmith, this.good_id, this.amount);
        console.debug(`Blacksmith finished making a [${this.good_id}].`);
    }
}

class MakeIronSwordAction extends BaseMakeAction {
    name = 'MakeIronSword';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronSword;
    action_input = new Map([[GoodID.IronIngot, 2]]);
}

class MakeIronShieldAction extends BaseMakeAction {
    name = 'MakeIronShield';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronShield;
    action_input = new Map([[GoodID.IronIngot, 4]]);
}

class MakeIronHelmetAction extends BaseMakeAction {
    name = 'MakeIronHelmet';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronHelmet;
    action_input = new Map([[GoodID.IronIngot, 2]]);
}

class MakeIronPlateAction extends BaseMakeAction {
    name = 'MakeIronPlate';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronPlate;
    action_input = new Map([[GoodID.IronIngot, 6]]);
}

class MakeIronMailAction extends BaseMakeAction {
    name = 'MakeIronMail';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronMail;
    action_input = new Map([[GoodID.IronIngot, 3]]);
}

class MakeIronPantsAction extends BaseMakeAction {
    name = 'MakeIronPants';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronPants;
    action_input = new Map([[GoodID.IronIngot, 4]]);
}

class MakeIronBootsAction extends BaseMakeAction {
    name = 'MakeIronBoots';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronBoots;
    action_input = new Map([[GoodID.IronIngot, 2]]);
}

class MakeIronGauntletAction extends BaseMakeAction {
    name = 'MakeIronGauntlet';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronGauntlet;
    action_input = new Map([[GoodID.IronIngot, 2]]);
}

class MakeIronSpearAction extends BaseMakeAction {
    name = 'MakeIronSpear';
    total_ticks = 8; // 4 hours
    building_id = BuildingID.BlackSmith;

    good_id = GoodID.IronSpear;
    action_input = new Map([[GoodID.IronIngot, 1]]);
}
