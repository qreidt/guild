import type {InventoryAccount, InventoryID, Transaction, TransactionID} from "./common.ts";
import {InventoryAccountService} from "./inventory.service.ts";
import {ToBeImplemented} from "../../exceptions/ToBeImplemented.ts";
import inventoryRepository from "./inventory.repository.ts";


export class TransactionService {
    public createTransaction(origin: InventoryID|null, destination: InventoryID, contents: Partial<InventoryAccount>): TransactionID {
        if (origin) {
            const inventory_origin = new InventoryAccountService(origin);

            if (contents.stacks && ! inventory_origin.validateLedger(contents.stacks)) {
                throw new InsufficientTransactionContentsError(origin, destination, contents);
            }

            if (contents.instances) {
                // ToDo: Implement equipments validations
                throw new ToBeImplemented('EquipmentsTransactions');
            }
        }

        const transaction = {
            origin,
            destination,
            contents: {
                stacks: contents.stacks ?? new Map(),
                instances: contents.instances ?? [],
            } as InventoryAccount,
        };

        return inventoryRepository.createTransaction(transaction);
    }

    public commitTransaction(id: TransactionID): void {
        inventoryRepository.commitTransaction(id);
    }
}

export default new TransactionService();


export class InsufficientTransactionContentsError extends Error {
    constructor(
        public readonly origin: InventoryID,
        public readonly destination: InventoryID,
        public readonly contents: Partial<InventoryAccount>
    ) {
        super(`Insufficient contents to perform the transaction. Origin: ${origin}, Destination: ${destination}, Contents: ${JSON.stringify(contents)}`);
    }
}