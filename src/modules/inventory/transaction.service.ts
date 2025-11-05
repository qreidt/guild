import type {InventoryAccount, InventoryID, Transaction, TransactionID} from "./common.ts";
import {InventoryAccountService} from "./inventory.service.ts";
import {ToBeImplemented} from "../../exceptions/ToBeImplemented.ts";
import inventoryRepository from "./inventory.repository.ts";


export class TransactionService {
    public createTransaction(origin: InventoryID|null, destination: InventoryID, contents: Partial<InventoryAccount>): TransactionID {
        if (origin) {
            const inventory_origin = new InventoryAccountService(origin);

            if (contents.goods && ! inventory_origin.validateLedger(contents.goods)) {
                throw new InsufficientTransactionContentsError(origin, destination, contents);
            }

            if (contents.equipments) {
                // ToDo: Implement equipments validations
                throw new ToBeImplemented('EquipmentsTransactions');
            }
        }

        const transaction = {
            origin,
            destination,
            contents: {
                goods: contents.goods ?? new Map(),
                equipments: contents.equipments ?? [],
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