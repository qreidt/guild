import type {ItemID} from "../items/id.ts";
import {AvailableGoods} from "../../game/common/AvailableGoods.ts";
import type {IEquippableItem} from "../../game/adventurer/gear/EquippableItem.ts";
import type {GoodLedger, InventoryAccount, InventoryID} from "./common.ts";
import inventoryRepository from "./inventory.repository.ts";
import type {EquippableItem} from "../items/item.ts";
import {ItemRegistry} from "../items/registry.ts";

export class InventoryAccountService {
    constructor(private readonly id: InventoryID) {}

    /**
     * Get count of a specific good for a building.
     *
     * For simple goods (GoodType.Good) this returns the amount stored in the
     * account's `goods` ledger. For equippable items the method counts how
     * many equipments in the account match the requested `item_id`.
     *
     * If the building account does not exist yet it will be created and
     * this method returns 0.
     *
     * @param item_id - id of the good to count
     * @returns number of items of the given good in the building account
     */
    getCount(item_id: ItemID): number {
        return inventoryRepository.getCount(this.id, item_id);
    }

    /**
     * Build a combined ledger of goods for a building.
     *
     * This returns a new Map (GoodLedger) aggregating counts from the
     * account's `goods` ledger and the `equipments` array. Equipments are
     * counted by their `item_id` and added to the ledger counts.
     *
     * @returns GoodLedger mapping ItemID -> total count available
     */
    public getCountByGoodId(): GoodLedger {
        return inventoryRepository.getCountByGoodId(this.id);
    }

    /**
     * Put supplied items into the building account.
     *
     * Supports a partial `InventoryAccount` containing `goods` (a ledger map)
     * and/or `equipments` (array of equippable items). Goods from the
     * provided ledger are added to existing counts; equipments are appended.
     *
     * @param items - partial account describing goods and/or equipments to add
     */
    public put(items: Partial<InventoryAccount>): void {
        inventoryRepository.put(this.id, items);
    }

    /**
     * Add a quantity of a non-equippable good to the building account.
     *
     * Throws WrongGoodTypeError if the provided item_id is not of type
     * GoodType.Good (i.e., it's an equipment type).
     *
     * @param item_id - id of the good to add
     * @param amount - quantity to add
     */
    public putGood(item_id: ItemID, amount: number): void {
        inventoryRepository.putGood(this.id, item_id, amount);
    }

    /**
     * Add an equippable item to the building account's equipment list.
     *
     * @param equipment - equippable item instance to store
     */
    public putEquipment(equipment: EquippableItem): void {
        inventoryRepository.putEquipment(this.id, equipment);
    }

    /**
     * Validate that the building account contains at least the amounts
     * specified by `ledger` for each good id.
     *
     * Returns true when all requested amounts can be satisfied. Note:
     * - If a requested good id is not a simple good (GoodType.Good), the
     *   function treats that as a validation failure.
     *
     * @param ledger - GoodLedger mapping ItemID -> required amount
     * @returns boolean indicating whether the account satisfies the ledger
     */
    public validateLedger(ledger: GoodLedger): boolean {
        return inventoryRepository.validateLedger(this.id, ledger);
    }

    /**
     * Calculates and returns the total value of an account based on its goods and equipment.
     *
     * The total value is computed by multiplying the amount of each good by its value
     * and adding the value of all equipment in the account.
     *
     * @return {number} The computed total value of the account.
     */
    public getValue(): number {
        const account = inventoryRepository.getAccount(this.id);

        let sum = 0;
        account.stacks.forEach((amount: number, item_id: ItemID) => {
            const good_value = ItemRegistry[item_id].value;
            sum += good_value * amount;
        });

        account.instances.forEach((equipment: EquippableItem) => {
            sum += equipment.static.value;
        });

        return sum;
    }

    /**
     * Calculates and returns the total weight of goods and equipment associated with the account.
     *
     * @return {number} The total weight calculated based on the account's goods and equipment.
     */
    public getWeight(): number {
        const account = inventoryRepository.getAccount(this.id);

        let sum = 0;
        account.stacks.forEach((amount: number, item_id: ItemID) => {
            const good_weight = ItemRegistry[item_id].weight;
            sum += good_weight * amount;
        });

        account.instances.forEach((equipment: EquippableItem) => {
            sum += equipment.static.weight;
        });

        return sum;
    }

    /**
     * Remove (take) quantities of goods from a building account.
     *
     * This first validates that the account contains the requested amounts
     * using `validateLedger`. If validation fails, an
     * InsufficientGoodsError is thrown. On success the goods ledger is
     * decremented by the requested amounts.
     *
     * @param goods - GoodLedger mapping ItemID -> amount to take
     * @throws InsufficientGoodsError when an account does not have enough goods
     */
    public takeGoods(goods: GoodLedger): void {
        return inventoryRepository.takeGoods(this.id, goods);
    }

    public validateTransaction(origin: InventoryID, goods: GoodLedger): boolean {
        return inventoryRepository.validateLedger(origin, goods);
    }
}
