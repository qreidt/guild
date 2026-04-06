import {
    type InventoryAccount,
    type InventoryID,
    type TransactionID,
} from "./common.ts";
import {InventoryAccountService} from "./inventory.service.ts";
import {ToBeImplemented} from "../../exceptions/ToBeImplemented.ts";
import inventoryRepository from "./inventory.repository.ts";


export class TransactionService {
    public createTransaction(
        origin: InventoryID|null,
        destination: InventoryID,
        input: null| Partial<InventoryAccount> = null,
        output: null| Partial<InventoryAccount> = null,
    ): TransactionID {
        if (origin) {
            const inventory_origin = new InventoryAccountService(origin);

            if (input?.stacks && ! inventory_origin.validateLedger(input.stacks)) {
                throw new InsufficientTransactionContentsError(origin, destination, input);
            }

            if (input?.instances) {
                // ToDo: Implement instances validations
                throw new ToBeImplemented('Instances Transactions');
            }
        }

        const transaction = {
            origin,
            destination,
            input: {
                stacks: input?.stacks ?? new Map(),
                instances: input?.instances ?? []
            },
            output: {
                stacks: output?.stacks ?? new Map(),
                instances: output?.instances ?? []
            },
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