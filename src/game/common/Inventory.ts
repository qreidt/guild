import {AvailableGoods, GoodID} from "./Good.ts";
import {EquippableItem, type IEquippableItem} from "../adventurer/gear/EquippableItem.ts";

export type InventoryList = Map<GoodID, number>;

export class Inventory {

    public goods: InventoryList;
    public equipable_items: EquippableItem[];

    constructor(items: null|InventoryList = null) {
        this.goods = items ?? new Map();
        this.equipable_items = [];
    }

    public static create(record: Record<GoodID, number>): Inventory {
        return new Inventory($itemsMap(record));
    }

    /**
     * Puts a defined amount of goods in the goods map.
     *
     * If the item already exists in the map, the amount is added.
     *
     * @param item
     * @param amount
     */
    public putItem(item: GoodID, amount: number): number {
        if (! this.goods.has(item)) {
            this.goods.set(item, amount);
            return amount;
        }

        const new_amount = this.goods.get(item)! + amount;
        this.goods.set(item, new_amount);

        return new_amount;
    }

    /**
     * Removes a defined amount of a determined item from the goods map.
     *
     * If the resulting amount of the item is 0, the item is deleted from the map.
     *
     * If the retrieved amount is greater than the existing amount, an exception is thrown.
     *
     * @param item
     * @param requested_amount
     */
    public retrieveItem(item: GoodID, requested_amount: number): number {
        const available_amount = this.getItem(item);
        if (available_amount < requested_amount) {
            throw new UnableToRetrieveItemsFromInventory(item, requested_amount, available_amount);
        }

        const new_amount = available_amount - requested_amount;
        if (new_amount === 0) {
            this.goods.delete(item);
            return 0;
        }

        this.goods.set(item, new_amount);
        return new_amount;
    }

    public retrieveItems(list: InventoryList): InventoryList {
        for (const [item, required_amount] of list) {
            this.retrieveItem(item, required_amount);
        }

        return list;
    }

    /**
     * Retrieves a list of inventory goods and creates a new inventory with them
     * @param record
     */
    public retrieveIntoNew(record: Record<GoodID, number>): Inventory {
        const recovery: [GoodID, number][] = [];

        try {
            for (const entry of Object.entries(record) as [GoodID, number][]) {
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
    public getItem(item: GoodID): number {
        return this.goods.get(item) ?? 0;
    }

    public hasItems(list: InventoryList): boolean {
        for (const [item, required_amount] of list) {
            const inventory_amount = this.getItem(item);
            if (inventory_amount < required_amount) {
                return false;
            }
        }

        return true;
    }

    public addEquipableItem(item: EquippableItem): void {
        this.equipable_items.push(item);
    }

    public takeEquipableItem(index: number): EquippableItem {
        const item = this.equipable_items[index];
        delete this.equipable_items[index];
        return item;
    }

    public get value(): number {
        let total = 0;

        for (const [itemId, amount] of this.goods) {
            const item = AvailableGoods[itemId];
            total += item.value * amount;
        }

        for (const item of this.equipable_items) {
            total += item.value;
        }

        return total;
    }

    public get weight(): number {
        let total = 0;

        for (const [itemId, amount] of this.goods) {
            const item = AvailableGoods[itemId];
            total += item.weight * amount;
        }

        for (const item of this.equipable_items) {
            total += item.weight;
        }

        return total;
    }

    public getItemCountByGoodID(): Map<GoodID, number> {
        const map = this.goods as Map<GoodID, number>;

        for (const equipable_item of this.equipable_items) {
            const good_id = (equipable_item.constructor as typeof EquippableItem).good_id;

            const count = map.get(good_id) ?? 0;
            map.set(good_id, count + 1);
        }

        return map;
    }
}

export function $itemMap(item: GoodID, amount: number): InventoryList {
    return new Map([[item, amount]]);
}

export function $itemsMap(record: Record<GoodID, number>): InventoryList {
    return new Map(Object.entries(record).reduce((agg, value) => {
        // @ts-ignore
        agg.push(value);
        return agg;
    }, []));
}

class UnableToRetrieveItemsFromInventory extends Error {
    constructor(
        public readonly item: GoodID,
        public readonly requested_amount: number,
        public readonly available_amount: number
    ) {
        super();
    }
}
