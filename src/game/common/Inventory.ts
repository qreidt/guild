import {BaseGood} from "./Good.ts";

export type InventoryList = Map<(typeof BaseGood), number>;
export type InventoryItem = [typeof BaseGood, number];

export class Inventory {

    public items: InventoryList = new Map();

    /**
     * Puts a defined amount of items in the items map.
     *
     * If the item already exists in the map, the amount is added.
     *
     * @param item
     * @param amount
     */
    public putItem(item: typeof BaseGood, amount: number): number {
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
    public retrieveItem(item: typeof BaseGood, requested_amount: number): number {
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
     * Gets the amount of the specified item or 0 by default.
     *
     * @param item
     */
    public getItem(item: typeof BaseGood): number {
        return this.items.get(item) ?? 0;
    }
}

class UnableToRetrieveItemsFromInventory extends Error {
    constructor(
        public readonly item: typeof BaseGood,
        public readonly requested_amount: number,
        public readonly available_amount: number
    ) {
        super();
    }
}
