import {ArmorType, Armor} from "../../modules/items/values/armor.ts";
import {Weapon} from "../../modules/items/values/weapons.ts";
import type {EquippableItem} from "../../modules/items/item.ts";
import {InventoryAccountService} from "../../modules/inventory/inventory.service.ts";
import type {ItemID} from "../../modules/items/id.ts";
import marketService from "../../modules/market/market.service.ts";
import {Action, WaitAction} from "../city/buildings/common/Action.ts";
import questService from "../../modules/quests/quest.service.ts";
import {planObjective} from "../../modules/quests/objectives.ts";
import type {ClaimantID, Quest, QuestClaimant, QuestID, Wallet} from "../../modules/quests/common.ts";
import {RandomStream} from "../../modules/random/random.ts";
import {Location} from "../../modules/world/location.ts";
import {TravelAction} from "./actions/TravelAction.ts";
import {ForageAction} from "./actions/ForageAction.ts";
import {DeliverAction} from "./actions/DeliverAction.ts";

console.log(`[Adventurer] Loaded`);

let global_id = 1;

export enum AdventurerRank {
    Iron,
    Bronze,
    Silver,
    Gold,
    Adamantium,
    Platinum,
}

export enum AdventurerClass {
    Scout,
    Swordsman,
    Archer,
    Mage,
    Tank,
    Healer,
    Spearman,
}

export enum AdventurerEquipmentSlot {
    Head,
    Chest,
    Pants,
    Gloves,
    Boots,
    FirstArm,
    SecondArm,
}

type AdventurerEquipment = Map<AdventurerEquipmentSlot, EquippableItem>;

/**
 * A named, persistent individual who belongs to no building and chooses their
 * own work — the subject the game is named for.
 *
 * The loop is small and complete: look at the board, claim the first open quest,
 * do what its objective asks, get paid, look again. Everything specific to *what*
 * a quest asks lives in the objective resolvers; this class knows travelling,
 * foraging and delivering as verbs and no objective kind by name.
 *
 * They are not the property of the Adventurers' Guild, and not owned by the city:
 * the roster is ticked as a sibling to the city, not from inside it.
 */
export class Adventurer {
    public id: number = global_id++;

    /** Stable id used as their inventory account, quest claimant and seed. */
    public readonly gid: ClaimantID = `adventurer:${this.id}`;

    public rank: AdventurerRank = AdventurerRank.Iron;
    public class: AdventurerClass = AdventurerClass.Scout;

    /** Where they are standing. A named place, never a coordinate. */
    public location: Location = Location.Town;

    /** What they are doing right now; null when they have just finished. */
    public active_action: null | Action = null;

    /**
     * The one quest they hold. A single field, not a list — one adventurer, one
     * quest at a time, so the loop stays legible before parties exist.
     */
    public claimed_quest_id: null | QuestID = null;

    /**
     * Their own luck. Private per adventurer so an unrelated system's roll can
     * never perturb their foraging, and so a fixed seed replays their run
     * exactly — see ADR 0005.
     */
    public readonly random: RandomStream = new RandomStream(this.gid);

    public max_health: number = 30;
    public current_damage: number = 0;

    public money = 100;

    // Attributes
    public attribute_strength: number = 1;
    public attribute_agility: number = 1;
    public attribute_intelligence: number = 5;
    public attribute_vitality: number = 3;
    public attribute_wisdom: number = 1;
    public attribute_perception: number = 1;
    public attribute_luck: number = 1;
    public attribute_dexterity: number = 1;
    public attribute_stealth: number = 1;

    // Proficiencies proficiency
    // Equipment
    public proficiency_sword: number = 0;
    public proficiency_shield: number = 0;
    public proficiency_dual_wielding: number = 0;
    public proficiency_bow: number = 0;
    public proficiency_spear: number = 0;

    // Armor
    public proficiency_no_armor: number = 0;
    public proficiency_light_armor: number = 0;
    public proficiency_heavy_armor: number = 0;

    // Magic
    public proficiency_fire: number = 0;
    public proficiency_ice: number = 0;
    public proficiency_earth: number = 0;
    public proficiency_air: number = 0;
    public proficiency_lightening: number = 0;

    // Utility
    public proficiency_herbalism: number = 0;
    public proficiency_survival: number = 0;
    public proficiency_tracking: number = 0;

    public inventory: InventoryAccountService;

    public equipment: AdventurerEquipment = new Map();

    constructor(
        public name: string,
        adventurer_class: AdventurerClass = AdventurerClass.Scout,
    ) {
        this.class = adventurer_class;
        this.inventory = new InventoryAccountService(this.gid);
    }

    // --- the loop ----------------------------------------------------------

    /**
     * One tick of an adventurer's life: pick work if free, then do it. Mirrors
     * `BaseBuilding.handleTick` — chosen work starts and ticks in the same tick,
     * so nothing idles for a beat it did not earn.
     *
     * The catch is deliberate and narrow. `claim` and `fulfil` throw, which is
     * right for callers outside the loop, but nothing catches inside it and an
     * escaped throw kills the simulation for every building too. Both are
     * pre-validated (the board is filtered to Open quests; the planner only asks
     * to deliver a satisfied objective), so reaching here means a real bug —
     * which should be loud and survivable, not fatal.
     */
    public handleTick(): void {
        try {
            if (this.isAvailable()) {
                this.active_action = this.chooseNextAction();
                this.active_action.start();
            }

            this.active_action?.tick();
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`[${this.name}] dropped their work: ${message}`);
            this.active_action = null;
        }
    }

    public isAvailable(): boolean {
        return this.active_action === null || this.active_action.isDone();
    }

    /** What a resolver is allowed to see of them: what they carry, and where. */
    public get claimant(): QuestClaimant {
        return {
            id: this.gid,
            inventory: this.inventory,
            location: this.location,
        };
    }

    public get wallet(): Wallet {
        return {
            get: () => this.money,
            add: (n: number) => { this.money += n; },
        };
    }

    /**
     * Re-derived every time they are free, never precomputed. A forage shift can
     * come up short, so the number of shifts is unknowable in advance and any
     * fixed plan would be wrong by its second entry.
     *
     * The switch is the only place an `ObjectiveStep` becomes an `Action`, and
     * therefore the index of everything an adventurer can do (ADR 0006). It maps
     * step kinds, not objective kinds — adding `hunt` touches the resolver
     * registry, and touches this only if it needs a verb that does not exist yet.
     */
    private chooseNextAction(): Action {
        const quest = this.currentQuest() ?? this.claimNextQuest();

        // Nothing to do: wait quietly in town. An idle city is calm, not broken.
        if (!quest) return new WaitAction();

        const next = planObjective(quest, this.claimant);

        switch (next.step) {
            case 'travel':
                return new TravelAction(this, next.to);

            case 'forage':
                return new ForageAction(this, next.item, next.at);

            case 'deliver':
                return new DeliverAction(this, quest.id);

            case 'done':
                // The single place a quest is released. Costs one waiting tick
                // before they look at the board again — a breather between jobs,
                // and worth it to keep letting go in exactly one place.
                this.claimed_quest_id = null;
                return new WaitAction();
        }
    }

    private currentQuest(): Quest | null {
        return this.claimed_quest_id ? questService.get(this.claimed_quest_id) : null;
    }

    /**
     * The **first open quest in post order**.
     *
     * Deliberately provisional, and deliberately not "the best-paying one".
     * Deterministic keeps console runs assertable, and obviously-arbitrary keeps
     * anyone from mistaking it for a design decision. It is replaced by rank- and
     * skill-matched claiming when missions aimed at experienced adventurers
     * arrive; a "highest reward" rule would be a preference model that quietly
     * survived into that cycle and fought with it.
     */
    private claimNextQuest(): Quest | null {
        const next = questService.getOpen()[0];
        if (!next) return null;

        const quest = questService.claim(next.id, this.gid);
        this.claimed_quest_id = quest.id;

        console.debug(`[${this.name}] claimed ${quest.id}.`);

        return quest;
    }

    /**
     * Adds an item to the desired slot.
     *
     * If another item already exists in that slot, returns the item.
     *
     * @param slot
     * @param item
     */
    public equipItem(slot: AdventurerEquipmentSlot, item: EquippableItem): null|EquippableItem {
        if (! this.validateEquipItem(slot, item)) {
            return null; // ToDo throw exception
        }

        const equipped_item = this.unEquipItem(slot);
        this.equipment.set(slot, item);

        return equipped_item;
    }

    private validateEquipItem(slot: AdventurerEquipmentSlot, item: EquippableItem): boolean {
        switch (slot) {
            case AdventurerEquipmentSlot.Head:
            case AdventurerEquipmentSlot.Chest:
            case AdventurerEquipmentSlot.Pants:
            case AdventurerEquipmentSlot.Gloves:
            case AdventurerEquipmentSlot.Boots:
                if (!(item instanceof Armor)) {
                    return false;
                }

                return ({
                    [AdventurerEquipmentSlot.Head]: ArmorType.Head,
                    [AdventurerEquipmentSlot.Chest]: ArmorType.Chest,
                    [AdventurerEquipmentSlot.Pants]: ArmorType.Pants,
                    [AdventurerEquipmentSlot.Gloves]: ArmorType.Glove,
                    [AdventurerEquipmentSlot.Boots]: ArmorType.Shoes,
                }[slot]) === item.static.type;

            case AdventurerEquipmentSlot.FirstArm:
                if (! (item instanceof Weapon)) {
                    return false;
                }

                // Check if item in the secondary hand if equipping a dual handed weapon
                if (item.static.dual_handed && ! this.equipment.has(AdventurerEquipmentSlot.SecondArm)) {
                    return true;
                }

                return true;

            case AdventurerEquipmentSlot.SecondArm:
                // check if the first hand has a dual handed weapon
                if (this.equipment.has(AdventurerEquipmentSlot.FirstArm)) {
                    return false;
                }

                // Only allow shield as armor
                if (item instanceof Armor && item.static.type !== ArmorType.Shield) {
                    return false;
                }

                // Allow only goods that can be dual weld.
                return item instanceof Weapon && item.static.can_dual_wield;
        }
    }

    public unEquipItem(slot: AdventurerEquipmentSlot): null | EquippableItem {
        const item = this.equipment.get(slot) ?? null;
        this.equipment.delete(slot);

        return item;
    }

    // Both take the same `wallet` the quest board is paid into. The market and
    // quest `Wallet` declarations are structurally identical and interchangeable
    // at every call site, which is why there is one getter and not two.
    public buyFromMarket(items: Map<ItemID, number>): void {
        marketService.buy(this.gid, this.wallet, items);
    }

    public sellToMarket(items: Map<ItemID, number>): void {
        marketService.sell(this.gid, this.wallet, items);
    }
}