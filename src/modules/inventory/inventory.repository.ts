import type {GoodLedger, InventoryAccount, InventoryID, Transaction, TransactionID} from "./common.ts";
import {ItemRegistry} from "../items/registry.ts";
import type {ItemID} from "../items/id.ts";
import type {EquippableItem} from "../items/item.ts";

let global_transaction_id = 0;

console.log(`[InventoryRepository] Loaded`);
/**
 * InventoryService
 *
 * Manages inventory accounts per building. Each account contains a ledger
 * of non-equippable goods (`goods` map) and an array of equippable items
 * (`equipments`). The service exposes helpers to read counts, add items,
 * validate and remove goods.
 */
export class InventoryRepository {

    constructor() {
        console.log(`[InventoryRepository] OK`);
    }

    /** Map of building id -> inventory account */
    public readonly accounts: Map<InventoryID, InventoryAccount> = new Map();

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
     * @param id - id of the building/account to query
     * @param item_id - id of the good to count
     * @returns number of items of the given good in the building account
     */
    public getCount(id: InventoryID, item_id: ItemID): number {
        const item = ItemRegistry[item_id];
        const account = this.accounts.get(id);

        if (! account) {
            this.accounts.set(id, {
                stacks: new Map(),
                instances: [],
            });

            return 0;
        }

        if (item.stackable) {
            return account.stacks.get(item_id) ?? 0;
        }

        return account.instances.reduce((sum, equipment) => {
            return equipment.static.id === item_id ? sum + 1 : sum;
        }, 0);
    }

    /**
     * Build a combined ledger of goods for a building.
     *
     * This returns a new Map (GoodLedger) aggregating counts from the
     * account's `goods` ledger and the `equipments` array. Equipments are
     * counted by their `item_id` and added to the ledger counts.
     *
     * @param id - id of the building/account to build the ledger for
     * @returns GoodLedger mapping GoodID -> total count available
     */
    public getCountByGoodId(id: InventoryID): GoodLedger {
        const account = this.getAccount(id);
        const ledger = structuredClone(account.stacks);

        account.instances.forEach(equipment => {
            const count = ledger.get(equipment.static.id) ?? 0;
            ledger.set(equipment.static.id, count+1);
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
     * @param id - id of the building/account to receive items
     * @param items - partial account describing goods and/or equipments to add
     */
    public put(id: InventoryID, items: Partial<InventoryAccount>): void {
        if (items.stacks) {
            items.stacks.forEach((amount: number, item_id: ItemID) => {
                this.putGood(id, item_id, amount);
            });
        }

        if (items.instances) {
            items.instances.forEach(equipment => {
                this.putEquipment(id, equipment);
            });
        }
    }

    /**
     * Add a quantity of a non-equippable good to the building account.
     *
     * Throws WrongGoodTypeError if the provided item_id is not of type
     * GoodType.Good (i.e., it's an equipment type).
     *
     * @param id - id of the building/account
     * @param item_id - id of the good to add
     * @param amount - quantity to add (can be negative to subtract)
     */
    public putGood(id: InventoryID, item_id: ItemID, amount: number): void {
        const account = this.getAccount(id);

        const count = account.stacks.get(item_id) ?? 0;
        account.stacks.set(item_id, count + amount);
    }

    /**
     * Add an equippable item to the building account's equipment list.
     *
     * @param id - id of the building/account
     * @param equipment - equippable item instance to store
     */
    public putEquipment(id: InventoryID, equipment: EquippableItem): void {
        const account = this.getAccount(id);
        account.instances.push(equipment);
    }

    /**
     * Retrieve the account for a building, creating it if necessary.
     *
     * @param id - id of the building/account to retrieve
     * @returns InventoryAccount for the building
     */
    public getAccount(id: InventoryID): InventoryAccount {
        let account = this.accounts.get(id);
        if (account) return account;

        this.accounts.set(id, {
            stacks: new Map(),
            instances: [],
        });

        return this.accounts.get(id)!;
    }

    /**
     * Validate that the building account contains at least the amounts
     * specified by `ledger` for each good id.
     *
     * Returns true when all requested amounts can be satisfied.
     *
     * @param id - id of the building/account to validate against
     * @param ledger - GoodLedger mapping GoodID -> required amount
     * @returns boolean indicating whether the account satisfies the ledger
     */
    public validateLedger(id: InventoryID, ledger: GoodLedger): boolean {
        const account_ledger = this.getCountByGoodId(id);
        for (const [item_id, required_amount] of ledger) {
            const account_amount = account_ledger.get(item_id) ?? 0;
            if (required_amount > account_amount) {
                return false;
            }
        }

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
     * @param id - id of the building/account to take goods from
     * @param goods - GoodLedger mapping GoodID -> amount to take
     * @throws InsufficientGoodsError when account does not have enough goods
     */
    public takeGoods(id: InventoryID, goods: GoodLedger): void {
        if (! this.validateLedger(id, goods)) {
            throw new InsufficientGoodsError(goods, this.getCountByGoodId(id));
        }

        const account = this.getAccount(id);
        goods.forEach((take_amount: number, item_id: ItemID) => {
            const current_amount = account.stacks.get(item_id) ?? 0;
            account.stacks.set(item_id, current_amount - take_amount);
        });
    }

    ///////////////
    //// TRANSACTIONS
    /////////

    /** Temporary account storing goods before said transaction is committed */
    public readonly transactions: Map<string, BaseTransaction> = new Map();

    /**
     * Creates a transaction and assigns it a unique transaction ID.
     * The transaction is stored, and goods are taken from the specified origin.
     *
     * @param {BaseTransaction} transaction - The transaction object containing details such as origin and goods contents.
     * @return {TransactionID} - The unique identifier for the newly created transaction.
     */
    public createTransaction(transaction: BaseTransaction): TransactionID {
        // const id = (global_id++).toString();
        const id = `${global_transaction_id++}:${transaction.origin ?? '-'}:${transaction.destination}`;
        this.transactions.set(id, transaction);

        if (transaction.origin) {
            if (transaction.input.stacks) this.takeGoods(transaction.origin, transaction.input.stacks);
            // if (transaction.input.instances) // ToDo take instances from origin.
        }

        return id;
    }

    /**
     * Commits a transaction by applying the transaction data to the destination
     * and removing it from the transaction store.
     *
     * @param {TransactionID} id - The unique identifier of the transaction to commit.
     * @return {void} This method does not return a value.
     * @throws {TransactionNotFoundError} If the transaction with the specified ID is not found.
     */
    public commitTransaction(id: TransactionID): void {
        const transaction = this.transactions.get(id);
        if (! transaction) throw new TransactionNotFoundError(id);

        this.put(transaction.destination, transaction.output);
        this.transactions.delete(id);
    }

    // ToDo implement rollback
}

type BaseTransaction = Omit<Transaction, 'id'>;

class InsufficientGoodsError extends Error{
    constructor(expected: GoodLedger, actual: GoodLedger) {
        super(`Current Good Ledger is ${JSON.stringify(actual)} and tried to take ${expected}`);
    }
}

class TransactionNotFoundError extends Error {
    constructor(id: TransactionID) {
        super(`Transaction ${id} not found`);
    }
}

export default new InventoryRepository();
