import {City} from "../../City.ts";
import type {Action} from "./Action.ts";
import {Worker} from "./Worker.ts";
import {InventoryAccountService} from "../../../../modules/inventory/inventory.service.ts";
import type {IArmor} from "../../../../modules/items/values/armor.ts";

console.log(`[Building] Loaded`);

export enum BuildingID {
    BlackSmith = 'BlackSmith',
    IronMine = 'IronMine',
    LumberMill = 'LumberMill',
}

export interface IBuilding {
    name: string;
    building_id: BuildingID;
}

export abstract class BaseBuilding {
    public abstract level: number;
    public abstract money: number;

    static name: string;
    static building_id: BuildingID;
    public inventory!: InventoryAccountService;

    public workers: Worker[] = [];

    /** Shortcut to access static props from the subclass */
    get static(): IBuilding {
        return this.constructor as unknown as IBuilding;
    }

    protected setup(): void {
        this.inventory = new InventoryAccountService(this.static.building_id.toString());
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
