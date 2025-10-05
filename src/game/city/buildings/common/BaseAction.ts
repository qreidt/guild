import {type BaseBuilding, BuildingID} from "./Building.ts";
import type {InventoryList} from "../../../common/Inventory.ts";
import gameController from "../../../controllers/GameController.ts";

export enum ActionStatus {
    ACTIVE = 0,
    FINISHED = 1,
}

export abstract class BaseAction {
    public abstract total_ticks: number;

    public status: ActionStatus;
    public ticks_remaining: number = 999;
    public action_input: null | InventoryList = null;

    protected abstract building_id: BuildingID;

    constructor() {
        this.status = ActionStatus.ACTIVE;
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