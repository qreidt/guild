import {type BaseBuilding, BuildingID} from "./Building.ts";
import gameController from "../../../controllers/GameController.ts";
import InventoryService, {type GoodLedger} from "../../../../modules/inventory/inventory.service.ts";
import {AvailableGoods} from "../../../common/Good.ts";

export enum ActionStatus {
    ACTIVE = 0,
    FINISHED = 1,
}

export abstract class Action {
    public name: string = '';
    public abstract total_ticks: number;

    public status: ActionStatus;
    public ticks_remaining: number = 999;
    public action_input: null | GoodLedger = null;

    protected abstract building_id: BuildingID|null;

    constructor() {
        this.status = ActionStatus.ACTIVE;
    }

    public validateInput(): boolean {
        if (!this.action_input) return true;
        return InventoryService.validateLedger(this.building_id!, this.action_input);
    }

    public start(): void {
        if (
            this.action_input &&
            ! InventoryService.validateLedger(this.building_id!, this.action_input)
        ) {
            throw new ActionInputException(this);
        }

        this.status = ActionStatus.ACTIVE;
        this.ticks_remaining = this.total_ticks;

        if (this.action_input) {
            InventoryService.takeGoods(this.building_id!, this.action_input);
        }

        if (this.started) this.started();
    }

    public tick(): void {
        if (this.status !== ActionStatus.ACTIVE) {
            return;
        }

        if (! this.shouldTick()) {
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
        //
    }
}

export abstract class TransportAction extends Action {
    name = 'Transport';
    public money: number = 0;

    get value(): number {
        if (! this.action_input) return this.money;

        let value = 0;
        this.action_input.forEach((amount, good_id) => {
            value += AvailableGoods[good_id].value * amount;
        });

        return value;
    }
}

export class WaitAction extends Action {
    name = 'Wait';
    public total_ticks: number = 1;
    public building_id: BuildingID | null = null;

    constructor(building_id: null|BuildingID = null) {
        super();

        if (building_id) this.building_id = building_id;
    }

    protected started() {
        console.debug(`${this.building_id} is waiting.`);
    }
}

export class ActionInputException extends Error {
    constructor(public readonly action: Action) {
        super('The building doesnt have enough input to execute the desired action.');
    }
}