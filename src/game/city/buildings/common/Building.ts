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
    Apothecary = 'Apothecary',
    AdventurersGuild = 'AdventurersGuild',
    Market = 'market',
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

    _data: any = {};

    /** Shortcut to access static props from the subclass */
    get static(): IBuilding {
        return this.constructor as unknown as IBuilding;
    }

    get id(): BuildingID {
        return this.static.building_id;
    }

    protected setup(): void {
        this.inventory = new InventoryAccountService(this.static.building_id.toString());
    }

    public handleTick(_city: City): void {
        this._data.inventory = this.inventory.getCountByGoodId();

        this.reviewQuests();

        const availableWorkers = this.workers.filter((w) => w.isAvailable());

        if (availableWorkers.length > 0) {
            for (const worker of availableWorkers) {
                worker.active_action = this.chooseNextAction();
                console.log(`[${worker.active_action?.static?.building_id}] Action Chosen is: ${worker.active_action.constructor.name}`);
                worker.active_action.start();
            }
        }

        for (const worker of this.workers) {
            worker.tick();
        }
    }

    /**
     * Once-per-tick review of what this building needs from the outside world,
     * and the only place a building posts a quest. A no-op by default; override
     * it to join the quest system.
     *
     * Deliberately NOT part of `chooseNextAction()`. That runs only when a
     * worker is idle, so posting from there would fall silent exactly when both
     * workers are busy consuming the very stock that is running out — the moment
     * the building most needs help. Running it here means a fully-occupied
     * building keeps asking.
     */
    protected reviewQuests(): void {
        //
    }

    protected abstract chooseNextAction(): Action;
}
