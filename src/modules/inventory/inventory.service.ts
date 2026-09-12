import type {ItemID} from "../items/id.ts";
import type {GoodLedger, InventoryAccount, InventoryID} from "./common.ts";
import inventoryRepository from "./inventory.repository.ts";
import type {EquippableItem} from "../items/item.ts";
import {ItemRegistry} from "../items/registry.ts";

/** Per-account facade over `inventoryRepository`, which documents each operation. */
export class InventoryAccountService {
    constructor(private readonly id: InventoryID) {}

    static init(id: InventoryID, items: null|Partial<InventoryAccount> = null): InventoryAccountService {
        const service = new InventoryAccountService(id);
        if (items) service.put(items);

        return service;
    }

    getCount(item_id: ItemID): number {
        return inventoryRepository.getCount(this.id, item_id);
    }

    public getCountByGoodId(): GoodLedger {
        return inventoryRepository.getCountByGoodId(this.id);
    }

    public put(items: Partial<InventoryAccount>): void {
        inventoryRepository.put(this.id, items);
    }

    public putGood(item_id: ItemID, amount: number): void {
        inventoryRepository.putGood(this.id, item_id, amount);
    }

    public putEquipment(equipment: EquippableItem): void {
        inventoryRepository.putEquipment(this.id, equipment);
    }

    public validateLedger(ledger: GoodLedger): boolean {
        return inventoryRepository.validateLedger(this.id, ledger);
    }

    /** Total catalog value of the account's stacks and equipment. */
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

    /** Total weight of the account's stacks and equipment. */
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

    public takeGoods(goods: GoodLedger): void {
        return inventoryRepository.takeGoods(this.id, goods);
    }

    public validateTransaction(origin: InventoryID, goods: GoodLedger): boolean {
        return inventoryRepository.validateLedger(origin, goods);
    }
}
