import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Worker} from "./common/Worker.ts";
import {Action, WaitAction} from "./common/Action.ts";
import {InventoryAccountService} from "../../../modules/inventory/inventory.service.ts";
import {ItemID} from "../../../modules/items/id.ts";
import questService from "../../../modules/quests/quest.service.ts";
import type {Wallet} from "../../../modules/quests/common.ts";
import {forageLocationFor} from "../../../modules/world/location.ts";

console.log(`[Apothecary] Loaded`);

/** Herbs to ask for per quest, and what the errand pays. */
const HERB_QUEST_QUANTITY = 10;

/**
 * Author-set, not derived from item value. Deriving it (goods value × a margin)
 * is the better long-term answer and is a drop-in replacement later — the field
 * is a number either way — but a hand-set figure is easier to tune while the
 * system is new. 10 Bloodroot is worth 30g; 45g is what makes the trip worth an
 * adventurer's time.
 */
const HERB_QUEST_REWARD = 45;

/** Post once stock falls below two brews' worth (a recipe consumes 3). */
const HERB_RESTOCK_THRESHOLD = 6;

/**
 * The first building whose input does NOT come from itself. The LumberMill and
 * IronMine conjure their inputs from nothing; the Apothecary brews foraged herbs
 * that arrive with adventurers — so when its shelf runs low it **posts a quest**
 * asking for more (see `reviewQuests`) instead of silently stalling. Until an
 * adventurer exists to claim it, the quest simply sits on the board.
 *
 * It has no income: it never sells its potions, and it now pays for gather
 * quests, so `money` only ever goes down. The starting 1000 (every other
 * building starts at 100) is a runway to watch the quest loop run, not an
 * economic statement. Do NOT "fix" it with a market sales line — see ADR 0004;
 * the intended revenue is adventurers buying potions here directly.
 */
export class Apothecary extends BaseBuilding {
    level = 1;
    money = 1000;

    static name = "Apothecary";

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

        for (const recipe of PRODUCTION_LIST) {
            const current_amount = list.get(recipe.product) ?? 0;
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

    /**
     * One quest per herb, posted the moment the shelf runs low.
     *
     * Each clause earns its place. Separate quests per herb so a Bloodroot
     * shortage does not hide behind a Manabloom one. The outstanding-quest check
     * is what stops an identical quest going up every single tick for as long as
     * stock stays low. And the reward leaves the wallet inside `post()`, so a
     * quest on the board is always funded — when the money runs out (it will,
     * see ADR 0004) `post()` returns null and the board simply goes quiet.
     */
    protected reviewQuests(): void {
        const stock = this.inventory.getCountByGoodId();

        for (const recipe of PRODUCTION_LIST) {
            if ((stock.get(recipe.reagent) ?? 0) >= HERB_RESTOCK_THRESHOLD) continue;

            if (questService.getOutstandingFor(recipe.reagent, this.id).length > 0) continue;

            // Ask the world where the herb grows rather than hard-coding a
            // forest, so a herb that moves table stays askable.
            const location = forageLocationFor(recipe.reagent);
            if (!location) continue;

            questService.post(
                this.id,
                this.wallet,
                { kind: 'gather', item: recipe.reagent, quantity: HERB_QUEST_QUANTITY, location },
                HERB_QUEST_REWARD,
            );
        }
    }

    private get wallet(): Wallet {
        return {
            get: () => this.money,
            add: (n: number) => { this.money += n; },
        };
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

/**
 * Everything the Apothecary makes, in priority order — and the herb each recipe
 * eats. One table so the brew loop and the quest loop can never disagree about
 * what this building needs: `chooseNextAction` reads `product`/`desired_amount`,
 * `reviewQuests` reads `reagent`.
 *
 * `reagent` restates the action's `input` key. Keep them in step: an action
 * whose reagent is wrong here brews fine and then never asks for more.
 */
const PRODUCTION_LIST = [
    {
        product: ItemID.HealthPotion,
        desired_amount: 3,
        action: BrewHealthPotionAction,
        reagent: ItemID.Bloodroot,
    },
    {
        product: ItemID.ManaPotion,
        desired_amount: 3,
        action: BrewManaPotionAction,
        reagent: ItemID.Manabloom,
    },
];
