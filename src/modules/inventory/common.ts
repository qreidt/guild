import type {ItemID} from "../items/id.ts";
import type {EquippableItem} from "../items/item.ts";

export type InventoryID = string;

export type GoodLedger = Map<ItemID, number>;

export type InventoryAccount = {
    stacks: GoodLedger,
    instances: EquippableItem[];
}

export type TransactionID = string;

export type Transaction = {
    id: TransactionID,
    origin: null|InventoryID,
    destination: InventoryID,
    input: InventoryAccount,
    output: InventoryAccount,
}
