import {type BaseBuilding, BuildingID} from "./Building.ts";
import gameController from "../../../controllers/GameController.ts";
import {InventoryAccountService} from "../../../../modules/inventory/inventory.service.ts";
import type {GoodLedger, InventoryID} from "../../../../modules/inventory/common.ts";
import transactionService from "../../../../modules/inventory/transaction.service.ts";
import {ItemRegistry} from "../../../../modules/items/registry.ts";
import marketService from "../../../../modules/market/market.service.ts";
import {MarketInsufficientFundsError, type Wallet} from "../../../../modules/market/common.ts";

let global_id = 0;

export enum ActionStatus {
    ACTIVE = 0,
    FINISHED = 1,
}

export interface IAction {
    name: string;
    input_origin: null | InventoryID;
    building_id: BuildingID | null;
}

export abstract class Action {
    public gid: string;
    public static name: string = '';
    public abstract total_ticks: number;

    public status: ActionStatus;
    public ticks_remaining: number = 999;

    public inventory: InventoryAccountService;

    public input: null | GoodLedger = null;
    public static input_origin: null | InventoryID = null;

    public output: null | GoodLedger = null;
    public output_destination: null | InventoryID = null;

    public transaction_id: null | string = null;

    static building_id: BuildingID | null = null;

    constructor() {
        this.gid = `action:${global_id++}:${this.static.name}`;
        this.status = ActionStatus.ACTIVE;
        this.inventory = new InventoryAccountService(this.gid);
    }

    /** Shortcut to access static props from the subclass */
    get static(): IAction {
        return this.constructor as unknown as IAction;
    }

    public validateInput(): boolean {
        if (!this.input) return true;
        if (!this.static.input_origin) return false;

        return this.inventory.validateTransaction(this.static.input_origin, this.input);
    }

    public start(): void {
        this.status = ActionStatus.ACTIVE;
        this.ticks_remaining = this.total_ticks;

        if (this.input) {
            this.transaction_id = transactionService
                .createTransaction(this.static.input_origin, this.output_destination!,
                    { stacks: this.input },
                    this.output ? { stacks: this.output } : null
                );
        }

        this.started();
    }

    public tick(): void {
        if (this.status !== ActionStatus.ACTIVE) {
            return;
        }

        if (!this.shouldTick()) {
            return;
        }

        this.beforeTick();

        this.ticks_remaining--;

        this.afterTick();

        if (this.ticks_remaining <= 0) {
            this.status = ActionStatus.FINISHED;
            this.commitTransaction();
            this.finished();
        }
    }

    protected getBuilding(): BaseBuilding {
        return gameController.getBuilding(this.static.building_id!)!;
    }

    public isDone(): boolean {
        return this.status === ActionStatus.FINISHED;
    }

    protected started(): void {
        //
    }

    protected shouldTick(): boolean {
        return true;
    }

    protected beforeTick(): void {
        //
    }

    protected afterTick(): void {
        //
    }

    protected commitTransaction(): void {
        if (this.transaction_id) {
            transactionService.commitTransaction(this.transaction_id);
        }
    }

    protected finished(): void {
        //
    }
}

export abstract class TransportAction extends Action {
    name = 'Transport';
    public money: number = 0;

    get value(): number {
        if (!this.input) return this.money;

        let value = 0;
        this.input.forEach((amount, item_id) => {
            value += ItemRegistry[item_id].value * amount;
        });

        return value;
    }

    /** Override: goods stay with seller until finished(); MarketService handles the transaction. */
    public start(): void {
        this.status = ActionStatus.ACTIVE;
        this.ticks_remaining = this.total_ticks;
        this.started();
    }

    protected finished() {
        const building = this.getBuilding();
        const wallet: Wallet = {
            get: () => building.money,
            add: (n: number) => { building.money += n; },
        };
        try {
            marketService.sell(building.id, wallet, this.input!);
            console.debug(`TransportAction finished transporting ${this.value} g.`);
        } catch (e) {
            if (e instanceof MarketInsufficientFundsError) {
                console.warn(`[TransportAction] Market insufficient funds: ${e.message}`);
            } else {
                throw e;
            }
        }
    }
}

export class WaitAction extends Action {
    name = 'Wait';
    public total_ticks: number = 1;
    static building_id = null;

    protected started() {
        // console.debug(`${this.building_id} is waiting.`);
    }
}

