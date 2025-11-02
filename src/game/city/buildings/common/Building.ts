import {Inventory} from "../../../common/Inventory.ts";
import {City} from "../../City.ts";
import type {Action} from "./Action.ts";
import {Worker} from "./Worker.ts";

export enum BuildingID {
    BlackSmith = 'BlackSmith',
    IronMine = 'IronMine',
    LumberMill = 'LumberMill',
}

export abstract class BaseBuilding {
    public abstract level: number;
    public abstract money: number;

    public workers: Worker[] = [];

    public handleTick(_city: City): void {
        const availableWorkers = this.workers.filter((w) => w.isAvailable());

        if (availableWorkers.length > 0) {
            for (const worker of availableWorkers) {
                worker.active_action = this.chooseNextAction();
                console.log(`Action Chosen is: ${worker.active_action.constructor.name}`);
                worker.active_action.start();
            }
        }

        for (const worker of this.workers) {
            worker.tick();
        }
    }

    protected abstract chooseNextAction(): Action;
}
