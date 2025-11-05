import type {IEquippableItem} from "../../game/adventurer/gear/EquippableItem.ts";
import type {GoodID} from "../../game/common/Good.ts";

export type InventoryID = string;

export type GoodLedger = Map<GoodID, number>;

export type InventoryAccount = {
    goods: GoodLedger,
    equipments: IEquippableItem[]
}

export type TransactionID = string;

export type Transaction = {
    id: TransactionID,
    origin: null|InventoryID,
    destination: InventoryID,
    contents: InventoryAccount,
}
