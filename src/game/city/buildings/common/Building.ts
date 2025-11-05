import {City} from "../../City.ts";
import type {Action} from "./Action.ts";
import {Worker} from "./Worker.ts";
import {InventoryAccountService} from "../../../../modules/inventory/inventory.service.ts";

export enum BuildingID {
    BlackSmith = 'BlackSmith',
    IronMine = 'IronMine',
    LumberMill = 'LumberMill',
}

export abstract class BaseBuilding {
    public abstract level: number;
    public abstract money: number;

    public name: string;
    public building_id: null|BuildingID = null;
    public inventory: InventoryAccountService;

    public workers: Worker[] = [];

    constructor() {
        this.name = this.building_id!.toString();
        this.inventory = new InventoryAccountService(this.building_id!.toString());
    }


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
