import {GoodID} from "./Good.ts";
import {WeaponID} from "../adventurer/gear/Weapon.ts";
import {ArmorID} from "../adventurer/gear/Armor.ts";

export const InventoryItemIDs = Object.keys({...GoodID, ...WeaponID, ...ArmorID})
    .reduce((agg, key) => {
        agg[key] = key;
        return agg;
    }, {} as Record<string, string>);

export type InventoryItemID = keyof typeof InventoryItemIDs;
export type InventoryList = Map<InventoryItemID, number>;

export class Inventory {

    public items: InventoryList;

    constructor(items: null|InventoryList = null) {
        this.items = items ?? new Map();
    }

    public static create(record: Record<InventoryItemID, number>): Inventory {
        return new Inventory($itemsMap(record));
    }

    /**
     * Puts a defined amount of items in the items map.
     *
     * If the item already exists in the map, the amount is added.
     *
     * @param item
     * @param amount
     */
    public putItem(item: InventoryItemID, amount: number): number {
        if (! this.items.has(item)) {
            this.items.set(item, amount);
            return amount;
        }

        const new_amount = this.items.get(item)! + amount;
        this.items.set(item, new_amount);

        return new_amount;
    }

    /**
     * Removes a defined amount of a determined item from the items map.
     *
     * If the resulting amount of the item is 0, the item is deleted from the map.
     *
     * If the retrieved amount is greater than the existing amount, an exception is thrown.
     *
     * @param item
     * @param requested_amount
     */
    public retrieveItem(item: InventoryItemID, requested_amount: number): number {
        const available_amount = this.getItem(item);
        if (available_amount < requested_amount) {
            throw new UnableToRetrieveItemsFromInventory(item, requested_amount, available_amount);
        }

        const new_amount = available_amount - requested_amount;
        if (new_amount === 0) {
            this.items.delete(item);
            return 0;
        }

        this.items.set(item, new_amount);
        return new_amount;
    }

    /**
     * Retrieves a list of inventory items and creates a new inventory with them
     * @param record
     */
    public retrieveIntoNew(record: Record<InventoryItemID, number>): Inventory {
        const recovery: [InventoryItemID, number][] = [];

        try {
            for (const entry of Object.entries(record) as [InventoryItemID, number][]) {
                this.retrieveItem(entry[0], entry[1]);
                recovery.push(entry);
            }

            return Inventory.create(record);
        } catch (e) {
            for (const entry of recovery) {
                this.putItem(entry[0], entry[1]);
                recovery.push(entry);
            }

            throw e;
        }
    }

    /**
     * Gets the amount of the specified item or 0 by default.
     *
     * @param item
     */
    public getItem(item: InventoryItemID): number {
        return this.items.get(item) ?? 0;
    }
}

export function $itemMap(item: InventoryItemID, amount: number): InventoryList {
    return new Map([[item, amount]]);
}

export function $itemsMap(record: Record<InventoryItemID, number>): InventoryList {
    return new Map(Object.entries(record).reduce((agg, value) => {
        // @ts-ignore
        agg.push(value);
        return agg;
    }, []));
}

class UnableToRetrieveItemsFromInventory extends Error {
    constructor(
        public readonly item: InventoryItemID,
        public readonly requested_amount: number,
        public readonly available_amount: number
    ) {
        super();
    }
}
