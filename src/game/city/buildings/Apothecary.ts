import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Worker} from "./common/Worker.ts";
import {Action, TransportAction, WaitAction} from "./common/Action.ts";
import type {Worker as BuildingWorker} from "./common/Worker.ts";
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

    /**
     * Seeded supply, as CQR-59 did for the herbs: enough to watch the building
     * work before an adventurer has walked anywhere.
     *
     * The everyday ingredients get two batches each. Two, not twenty, because
     * the point is to see the rotation turn and the first shelf reach the
     * market — not to make the quest loop redundant. Every one of them is below
     * `HERB_RESTOCK_THRESHOLD`, so the Apothecary posts for all of them on its
     * first tick and keeps asking as it burns through the seed.
     */
    public inventory: InventoryAccountService = InventoryAccountService.init(
        BuildingID.Apothecary, {
            stacks: new Map([
                [ItemID.Bloodroot, 10],
                [ItemID.Manabloom, 10],

                [ItemID.Kelp, 6],
                [ItemID.Mint, 2],
                [ItemID.CarrageenMoss, 4],
                [ItemID.WillowBark, 4],
                [ItemID.SphagnumMoss, 4],
                [ItemID.PineResin, 4],
                [ItemID.ValerianRoot, 4],
                [ItemID.Sulfur, 4],
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

    /**
     * Make what is missing; otherwise take the shelf to market; otherwise wait.
     *
     * **The order matters.** The sale is the fall-through, not the first check.
     * The LumberMill sells first, and copying that here would empty the shelf
     * between every batch — every row would be under target again on the next
     * pass, the first one would win, and the rotation that `desired_amount`
     * buys would be undone.
     */
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

        // Nothing left to make. One seller at a time, and only this one kind of
        // action needs the rule: a brew debits its ingredients at start(), but
        // TransportAction deliberately does not, so two sellers would snapshot
        // the same shelf. The first sale empties it and the second throws
        // InsufficientGoodsError out of takeGoods — which TransportAction does
        // NOT catch, it only handles MarketInsufficientFundsError — and that
        // kills the tick loop. Both workers reach this line together on every
        // round, so it is the common case, not a corner.
        //
        // Sound because handleTick assigns and starts each worker before
        // choosing for the next, so the second worker sees the first's action.
        if (this.workers.some(isSelling)) return new WaitAction();

        const shelf = this.everydayShelf(list);
        if (shelf.size > 0) return new SellEverydayGoodsAction(shelf);

        return new WaitAction();
    }

    /** What is on the everyday shelf right now. Never potions — see EVERYDAY_GOODS. */
    private everydayShelf(stock: GoodLedger): GoodLedger {
        const shelf: GoodLedger = new Map();

        for (const item of EVERYDAY_GOODS) {
            const amount = stock.get(item) ?? 0;
            if (amount > 0) shelf.set(item, amount);
        }

        return shelf;
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
 * Everyday goods take half a potion's time. They are meant to be simple, and a
 * flat figure rather than a ladder per product because the production list
 * rotates: every product is made equally often whatever its tick cost, so
 * scaling the time by value would buy nothing and cost seven constants.
 */
const MAKE_TICKS = 6; // 3 hours

class MakeKelpSoapAction extends Action {
    static name = 'MakeKelpSoap';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Kelp, 3]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.KelpSoap, 1]]);
}

class MakeCoughSyrupAction extends Action {
    static name = 'MakeCoughSyrup';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.CarrageenMoss, 2]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.CoughSyrup, 1]]);
}

class MakeWillowBarkTeaAction extends Action {
    static name = 'MakeWillowBarkTea';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    // The only two-ingredient recipe. `reviewQuests` posts a quest for each,
    // sized to its own recipe amount — 10 willow bark, 20 mint.
    input = new Map([[ItemID.WillowBark, 2], [ItemID.Mint, 1]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.WillowBarkTea, 1]]);
}

class MakeMossBandageAction extends Action {
    static name = 'MakeMossBandage';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.SphagnumMoss, 2]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.MossBandage, 1]]);
}

class MakePineBalmAction extends Action {
    static name = 'MakePineBalm';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.PineResin, 2]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.PineBalm, 1]]);
}

class MakeSleepingDraughtAction extends Action {
    static name = 'MakeSleepingDraught';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.ValerianRoot, 2]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.SleepingDraught, 1]]);
}

class MakeSulfurOintmentAction extends Action {
    static name = 'MakeSulfurOintment';
    static building_id = BuildingID.Apothecary;
    total_ticks = MAKE_TICKS;

    input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Sulfur, 2]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.SulfurOintment, 1]]);
}

/**
 * One row of what the Apothecary makes. `action` is the class, not an instance:
 * the recipe is read off a fresh one, never restated here.
 */
interface ProductionRow {
    product: ItemID;
    /**
     * How many to keep on the shelf before moving on to the next row.
     *
     * For the everyday goods this is **not a stock target — it is the
     * rotation**, and it is load-bearing. They are sold the moment they are
     * made, so their stock sits at 0; `chooseNextAction` skips a row only when
     * `current_amount >= desired_amount`, so dropping this field or setting it
     * to 0 would make the first row with ingredients in hand win on every pass,
     * forever. The building would quietly become a soap factory, throwing
     * nothing. A target of 1 is what makes the scan fall through to the next
     * product.
     */
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

    // The everyday line, all at 1 — see `desired_amount` above. Potions come
    // first: they are the building's purpose, and the everyday goods are what
    // pays for them.
    { product: ItemID.KelpSoap, desired_amount: 1, action: MakeKelpSoapAction },
    { product: ItemID.CoughSyrup, desired_amount: 1, action: MakeCoughSyrupAction },
    { product: ItemID.WillowBarkTea, desired_amount: 1, action: MakeWillowBarkTeaAction },
    { product: ItemID.MossBandage, desired_amount: 1, action: MakeMossBandageAction },
    { product: ItemID.PineBalm, desired_amount: 1, action: MakePineBalmAction },
    { product: ItemID.SleepingDraught, desired_amount: 1, action: MakeSleepingDraughtAction },
    { product: ItemID.SulfurOintment, desired_amount: 1, action: MakeSulfurOintmentAction },
];

/**
 * The everyday line — what the sell action takes to market.
 *
 * An explicit list, never "everything stackable on the shelf". ADR 0004
 * forbids selling **potions** to the market and is not amended on that point:
 * the Apothecary's potion revenue is meant to be adventurers buying them here
 * directly. A snapshot of the whole inventory would breach that silently, and
 * would also cart the ingredients off to be sold.
 */
const EVERYDAY_GOODS: readonly ItemID[] = [
    ItemID.KelpSoap,
    ItemID.CoughSyrup,
    ItemID.WillowBarkTea,
    ItemID.MossBandage,
    ItemID.PineBalm,
    ItemID.SleepingDraught,
    ItemID.SulfurOintment,
];

/** Is this worker already on a market run? */
function isSelling(worker: BuildingWorker): boolean {
    return worker.active_action instanceof SellEverydayGoodsAction
        && !worker.active_action.isDone();
}

/**
 * One trip to market with the whole everyday shelf.
 *
 * `TransportAction` moves nothing at `start()` — the goods stay here until
 * `finished()` hands them to `marketService.sell()`. That is what makes two of
 * these in flight at once fatal rather than merely wasteful; see the guard in
 * `chooseNextAction`.
 */
class SellEverydayGoodsAction extends TransportAction {
    static name = 'SellEverydayGoods';
    static building_id = BuildingID.Apothecary;

    total_ticks = 4; // 2 hours — the Market is inside the walls

    input_origin = BuildingID.Apothecary;

    constructor(shelf: GoodLedger) {
        super();
        this.input = shelf;
    }

    protected started() {
        console.debug(`Apothecary sent ${this.input!.size} everyday lines to market.`);
    }

    protected finished() {
        super.finished();
        console.debug(`Apothecary sold its everyday goods for ${this.value} g.`);
    }
}
