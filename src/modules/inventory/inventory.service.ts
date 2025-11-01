import {AvailableGoods, type GoodID, GoodType} from "../../game/common/Good.ts";
import type {BuildingID} from "../../game/city/buildings/common/Building.ts";
import type {IEquippableItem} from "../../game/adventurer/gear/EquippableItem.ts";

/**
 * InventoryService
 *
 * Manages inventory accounts per building. Each account contains a ledger
 * of non-equippable goods (`goods` map) and an array of equippable items
 * (`equipments`). The service exposes helpers to read counts, add items,
 * validate and remove goods.
 */
export class InventoryService {
    /** Map of building id -> inventory account */
    public readonly accounts: Map<BuildingID, InventoryAccount> = new Map();

    /**
     * Get count of a specific good for a building.
     *
     * For simple goods (GoodType.Good) this returns the amount stored in the
     * account's `goods` ledger. For equippable items the method counts how
     * many equipments in the account match the requested `good_id`.
     *
     * If the building account does not exist yet it will be created and
     * this method returns 0.
     *
     * @param building_id - id of the building/account to query
     * @param good_id - id of the good to count
     * @returns number of items of the given good in the building account
     */
    public getCount(building_id: BuildingID, good_id: GoodID): number {
        const good = AvailableGoods[good_id];
        const account = this.accounts.get(building_id);

        if (! account) {
            this.accounts.set(building_id, {
                goods: new Map(),
                equipments: [],
            });

            return 0;
        }

        if (good.good_type === GoodType.Good) {
            return account.goods.get(good_id) ?? 0;
        }

        return account.equipments.reduce((sum, equipment) => {
            return equipment.good_id === good_id ? sum + 1 : sum;
        }, 0);
    }

    /**
     * Build a combined ledger of goods for a building.
     *
     * This returns a new Map (GoodLedger) aggregating counts from the
     * account's `goods` ledger and the `equipments` array. Equipments are
     * counted by their `good_id` and added to the ledger counts.
     *
     * @param building_id - id of the building/account to build the ledger for
     * @returns GoodLedger mapping GoodID -> total count available
     */
    public getCountByGoodId(building_id: BuildingID): GoodLedger {
        const account = this.getAccount(building_id);
        const ledger = structuredClone(account.goods);

        account.equipments.forEach(equipment => {
            const count = ledger.get(equipment.good_id!) ?? 0;
            ledger.set(equipment.good_id!, count+1);
        });

        return ledger;
    }

    /**
     * Put supplied items into the building account.
     *
     * Supports a partial `InventoryAccount` containing `goods` (a ledger map)
     * and/or `equipments` (array of equippable items). Goods from the
     * provided ledger are added to existing counts; equipments are appended.
     *
     * @param building_id - id of the building/account to receive items
     * @param items - partial account describing goods and/or equipments to add
     */
    public put(building_id: BuildingID, items: Partial<InventoryAccount>): void {
        if (items.goods) {
            items.goods.forEach((amount: number, good_id: GoodID) => {
                this.putGood(building_id, good_id, amount);
            });
        }

        if (items.equipments) {
            items.equipments.forEach(equipment => {
                this.putEquipment(building_id, equipment);
            });
        }
    }

    /**
     * Add a quantity of a non-equippable good to the building account.
     *
     * Throws WrongGoodTypeError if the provided good_id is not of type
     * GoodType.Good (i.e., it's an equipment type).
     *
     * @param building_id - id of the building/account
     * @param good_id - id of the good to add
     * @param amount - quantity to add (can be negative to subtract)
     */
    public putGood(building_id: BuildingID, good_id: GoodID, amount: number): void {
        const good = AvailableGoods[good_id];
        if (good.good_type !== GoodType.Good) {
            throw new WrongGoodTypeError(GoodType.Good, good.good_type);
        }

        const account = this.getAccount(building_id);

        const count = account.goods.get(good_id) ?? 0;
        account.goods.set(good_id, count + amount);
    }

    /**
     * Add an equippable item to the building account's equipment list.
     *
     * @param building_id - id of the building/account
     * @param equipment - equippable item instance to store
     */
    public putEquipment(building_id: BuildingID, equipment: IEquippableItem): void {
        const account = this.getAccount(building_id);
        account.equipments.push(equipment);
    }

    /**
     * Retrieve the account for a building, creating it if necessary.
     *
     * @param building_id - id of the building/account to retrieve
     * @returns InventoryAccount for the building
     */
    private getAccount(building_id: BuildingID): InventoryAccount {
        let account = this.accounts.get(building_id);
        if (account) return account;

        this.accounts.set(building_id, {
            goods: new Map(),
            equipments: [],
        });

        return this.accounts.get(building_id)!;
    }

    /**
     * Validate that the building account contains at least the amounts
     * specified by `ledger` for each good id.
     *
     * Returns true when all requested amounts can be satisfied. Note:
     * - If a requested good id is not a simple good (GoodType.Good), the
     *   function treats that as a validation failure.
     *
     * @param building_id - id of the building/account to validate against
     * @param ledger - GoodLedger mapping GoodID -> required amount
     * @returns boolean indicating whether the account satisfies the ledger
     */
    public validateLedger(building_id: BuildingID, ledger: GoodLedger): boolean {
        const account_ledger = this.getCountByGoodId(building_id);
        ledger.forEach((required_amount: number, good_id: GoodID) => {
            if (AvailableGoods[good_id].good_type !== GoodType.Good) {
                return false;
            }

            const account_amount = account_ledger.get(good_id) ?? 0;
            if (required_amount > account_amount) {
                return false;
            }
        });

        return true;
    }

    /**
     * Remove (take) quantities of goods from a building account.
     *
     * This first validates that the account contains the requested amounts
     * using `validateLedger`. If validation fails, an
     * InsufficientGoodsError is thrown. On success the goods ledger is
     * decremented by the requested amounts.
     *
     * @param building_id - id of the building/account to take goods from
     * @param goods - GoodLedger mapping GoodID -> amount to take
     * @throws InsufficientGoodsError when account does not have enough goods
     */
    public takeGoods(building_id: BuildingID, goods: GoodLedger): void {
        if (! this.validateLedger(building_id, goods)) {
            throw new InsufficientGoodsError(goods, this.getCountByGoodId(building_id));
        }

        const account = this.getAccount(building_id);
        goods.forEach((take_amount: number, good_id: GoodID) => {
            const current_amount = account.goods.get(good_id) ?? 0;
            account.goods.set(good_id, current_amount - take_amount);
        });
    }
}

export type GoodLedger = Map<GoodID, number>;

export type InventoryAccount = {
    goods: GoodLedger,
    equipments: IEquippableItem[]
}

class WrongGoodTypeError extends Error {
    constructor(expected: GoodType, actual: GoodType) {
        super(`Expected ${expected} to be ${actual}`);
    }
}

class InsufficientGoodsError extends Error{
    constructor(expected: GoodLedger, actual: GoodLedger) {
        super(`Current Good Ledger is ${JSON.stringify(actual)} and tried to take ${expected}`);
    }
}

export default new InventoryService();
