import {type BaseBuilding, BuildingID} from "./Building.ts";
import {Inventory, type InventoryList} from "../../../common/Inventory.ts";
import gameController from "../../../controllers/GameController.ts";

export enum ActionStatus {
    ACTIVE = 0,
    FINISHED = 1,
}

export type ActionCallbacks = {
    started?: Function;
    shouldTick?: Function;
    beforeTick?: Function;
    afterTick?: Function;
    finished?: Function;
}

export abstract class BaseAction {
    public abstract total_ticks: number;

    public status: ActionStatus;
    public ticks_remaining: number = 999;
    public action_input: null | InventoryList = null;

    protected abstract building_id: BuildingID;

    // protected started: Function | null;
    // protected shouldTick: Function;
    // protected beforeTick: Function | null;
    // protected afterTick: Function | null;
    // protected finished: Function | null;

    constructor() {
        this.status = ActionStatus.ACTIVE;
        // this.started = callbacks.started ?? null;
        // this.shouldTick = callbacks.shouldTick ?? (() => true);
        // this.beforeTick = callbacks.beforeTick ?? null;
        // this.afterTick = callbacks.afterTick ?? null;
        // this.finished = callbacks.finished ?? null;
    }

    public validateInput(building: BaseBuilding): boolean {
        if (!this.action_input) return true;
        return building.inventory.hasItems(this.action_input);
    }

    public start(): void {
        const building = this.getBuilding();
        if (! this.validateInput(building)) {
            throw new ActionInputException(this);
        }

        this.status = ActionStatus.ACTIVE;
        this.ticks_remaining = this.total_ticks + 1;

        if (this.action_input) {
            building.inventory.retrieveItems(this.action_input);
        }

        if (this.started) this.started();
    }

    public tick(): void {
        if (this.status !== ActionStatus.ACTIVE) {
            return;
        }

        if (! this.shouldTick()) {
            console.log('Mill is sleeping.');
            return;
        }

        if (this.beforeTick) this.beforeTick();
        this.ticks_remaining--;
        if (this.afterTick) this.afterTick();

        if (this.ticks_remaining <= 0) {
            this.status = ActionStatus.FINISHED;
            if (this.finished) this.finished();
        }
    }

    protected getBuilding(): BaseBuilding {
        return gameController.getBuilding(this.building_id)!;
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

export class ActionInputException extends Error {
    constructor(public readonly action: BaseAction) {
        super('The building doesnt have enough input to execute the desired action.');
    }
}