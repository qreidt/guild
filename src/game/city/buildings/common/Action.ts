import {type BaseBuilding, BuildingID} from "./Building.ts";
import gameController from "../../../controllers/GameController.ts";
import {InventoryAccountService} from "../../../../modules/inventory/inventory.service.ts";
import {AvailableGoods} from "../../../common/Good.ts";
import type {GoodLedger, InventoryID} from "../../../../modules/inventory/common.ts";
import transactionService, {
    InsufficientTransactionContentsError
} from "../../../../modules/inventory/transaction.service.ts";

let global_id = 0;

export enum ActionStatus {
    ACTIVE = 0,
    FINISHED = 1,
}

export abstract class Action {
    public uid: string;
    public name: string = '';
    public abstract total_ticks: number;

    public status: ActionStatus;
    public ticks_remaining: number = 999;

    public inventory: InventoryAccountService;

    public input: null | GoodLedger = null;
    public input_origin: null | InventoryID = null;

    public output: null | GoodLedger = null;
    public output_destination: null | InventoryID = null;

    public transaction_id: null | string = null;

    protected abstract building_id: BuildingID | null;

    constructor() {
        this.uid = `action:${global_id++}:${this.name}`;
        this.status = ActionStatus.ACTIVE;
        this.inventory = new InventoryAccountService(this.uid);

        if (!this.name) this.name = this.constructor.name;
    }

    public validateInput(): boolean {
        if (!this.input) return true;
        if (!this.input_origin) return false;

        return this.inventory.validateTransaction(this.input_origin, this.input);
    }

    public start(): void {
        this.status = ActionStatus.ACTIVE;
        this.ticks_remaining = this.total_ticks;

        if (this.input) {
            this.transaction_id = transactionService
                .createTransaction(this.input_origin!, this.output_destination!, {
                    goods: this.input,
                });
        }

        if (this.started) this.started();
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
            this.finished();
        }
    }

    protected getBuilding(): BaseBuilding {
        return gameController.getBuilding(this.building_id!)!;
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

    protected finished(): void {
        if (this.transaction_id) {
            transactionService.commitTransaction(this.transaction_id);
        }
    }
}

export abstract class TransportAction extends Action {
    name = 'Transport';
    public money: number = 0;

    get value(): number {
        if (!this.input) return this.money;

        let value = 0;
        this.input.forEach((amount, good_id) => {
            value += AvailableGoods[good_id].value * amount;
        });

        return value;
    }

    protected finished() {
        super.finished();
        this.getBuilding().money += this.value;
        console.debug(`TransportAction finished transporting ${this.value} g.`);
    }
}

export class WaitAction extends Action {
    name = 'Wait';
    public total_ticks: number = 1;
    public building_id: BuildingID | null = null;

    constructor(building_id: null | BuildingID = null) {
        super();

        if (building_id) this.building_id = building_id;
    }

    protected started() {
        console.debug(`${this.building_id} is waiting.`);
    }
}

