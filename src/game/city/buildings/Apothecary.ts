import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Worker} from "./common/Worker.ts";
import {Action, WaitAction} from "./common/Action.ts";
import {InventoryAccountService} from "../../../modules/inventory/inventory.service.ts";
import {ItemID} from "../../../modules/items/id.ts";
import {ItemRegistry} from "../../../modules/items/registry.ts";
import type {GoodLedger} from "../../../modules/inventory/common.ts";
import questService from "../../../modules/quests/quest.service.ts";
import {gatherQuantityFor} from "../../../modules/quests/sizing.ts";
import type {Wallet} from "../../../modules/quests/common.ts";
import {forageLocationFor} from "../../../modules/world/location.ts";

/**
 * A recipe — what one batch consumes — read off the action itself.
 *
 * Deliberately derived rather than restated on the production row. The row used
 * to carry a `reagent: ItemID` beside the action with a comment warning the two
 * could drift — "an action whose reagent is wrong here brews fine and then
 * never asks for more". Three recipes now take two ingredients, so the field
 * would have to become a list: a longer thing to keep in step, with the same
 * failure. Reading the action's own `input` cannot disagree with it.
 *
 * ponytail: constructs an action per review pass to read its recipe. If that
 * ever shows up in a profile, lift the recipe to a static beside the instance
 * property — NOT by making `input` itself static, which is the footgun
 * described above `BrewHealthPotionAction`.
 */
function recipeOf(row: ProductionRow): GoodLedger {
    return new row.action().input!;
}

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
     * One quest per ingredient, posted the moment the shelf runs low.
     *
     * Each clause earns its place. Separate quests per ingredient so a Bloodroot
     * shortage does not hide behind a Manabloom one. The outstanding-quest check
     * is what stops an identical quest going up every single tick for as long as
     * stock stays low. And the reward leaves the wallet inside `post()`, so a
     * quest on the board is always funded — when the money runs out `post()`
     * returns null and the board simply goes quiet.
     *
     * Quantity and reward are derived, not authored: the reward is the
     * ingredient's own value per unit, and the quantity is whatever multiple of
     * the recipe amount makes the errand worth `MIN_QUEST_VALUE`. A recipe with
     * two ingredients posts two quests, each sized to its own ingredient.
     */
    protected reviewQuests(): void {
        const stock = this.inventory.getCountByGoodId();

        for (const row of PRODUCTION_LIST) {
            for (const [reagent, recipe_amount] of recipeOf(row)) {
                if ((stock.get(reagent) ?? 0) >= HERB_RESTOCK_THRESHOLD) continue;

                if (questService.getOutstandingFor(reagent, this.id).length > 0) continue;

                // Ask the world where it grows rather than hard-coding a
                // forest, so an ingredient that moves table stays askable.
                const location = forageLocationFor(reagent);
                if (!location) continue;

                const unit_value = ItemRegistry[reagent].value;
                const quantity = gatherQuantityFor(unit_value, recipe_amount);

                questService.post(
                    this.id,
                    this.wallet,
                    { kind: 'gather', item: reagent, quantity, location },
                    unit_value * quantity,
                );
            }
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

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Bloodroot, 3]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.HealthPotion, 1]])
}

class BrewManaPotionAction extends Action {
    static name = 'BrewManaPotion';
    static building_id = BuildingID.Apothecary;
    total_ticks = 12; // 6 hours

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Manabloom, 3]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.ManaPotion, 1]])
}

/**
 * One row of what the Apothecary makes. `action` is the class, not an instance:
 * the recipe is read off a fresh one, never restated here.
 */
interface ProductionRow {
    product: ItemID;
    desired_amount: number;
    action: new () => Action;
}

/**
 * Everything the Apothecary makes, in priority order. One table so the
 * production loop and the quest loop can never disagree about what this
 * building needs: `chooseNextAction` reads `product`/`desired_amount`, and
 * `reviewQuests` reads the ingredients off `action` through `reagentsOf`.
 */
const PRODUCTION_LIST: ProductionRow[] = [
    {
        product: ItemID.HealthPotion,
        desired_amount: 3,
        action: BrewHealthPotionAction,
    },
    {
        product: ItemID.ManaPotion,
        desired_amount: 3,
        action: BrewManaPotionAction,
    },
];
