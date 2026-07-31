import type { Action } from "../../game/city/buildings/common/Action.ts";
import type { Worker } from "../../game/city/buildings/common/Worker.ts";
import { BuildingID, type BaseBuilding } from "../../game/city/buildings/common/Building.ts";
import type { City } from "../../game/city/City.ts";
import { ItemRegistry } from "../items/registry.ts";
import type {
    CityBuildingSummary,
    CityView,
    EnvironmentView,
    InventoryRow,
    WorkerStatus,
    WorkerView,
} from "./types.ts";

/**
 * Pure mappers that turn live engine state into render-agnostic DTOs.
 *
 * Strictly read-only: nothing here mutates a building, worker, action,
 * inventory, or controller. No Vue, no `three`.
 */

/** Declarative per-building worker label prefix; e.g. BlackSmith -> "Smith 1". */
const WORKER_LABEL_PREFIX: Partial<Record<BuildingID, string>> = {
    [BuildingID.BlackSmith]: 'Smith',
    [BuildingID.IronMine]: 'Miner',
    [BuildingID.LumberMill]: 'Lumberjack',
    [BuildingID.Apothecary]: 'Herbalist',
    [BuildingID.Market]: 'Trader',
};

const DEFAULT_WORKER_PREFIX = 'Worker';

/**
 * The raw action identifier. We read `constructor.name` (equivalently
 * `static.name`) rather than `action.name`: every Blacksmith production action
 * declares a `static name` and no instance `name`, so `action.name` is
 * `undefined`. `constructor.name` is defined and specific for all concrete
 * actions. Returned raw — no humanization in this pass.
 */
export function resolveTaskLabel(action: Action | null): string | null {
    return action ? action.constructor.name : null;
}

/**
 * Progress in [0, 1]. Guards every edge case the engine can present:
 * - no action / finished action -> 0
 * - the `999` pre-start sentinel (ticks_remaining > total_ticks) -> clamped to 0
 * - total_ticks <= 0 (non-finite division) -> 0
 */
export function workerProgress(action: Action | null): number {
    if (!action || action.isDone()) {
        return 0;
    }

    const progress = 1 - action.ticks_remaining / action.total_ticks;
    return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
}

export function mapWorker(worker: Worker, index: number, labelPrefix: string): WorkerView {
    const action = worker.active_action;
    const status: WorkerStatus = action && !action.isDone() ? 'working' : 'idle';

    return {
        label: `${labelPrefix} ${index + 1}`,
        task: resolveTaskLabel(action),
        progress: workerProgress(action),
        status,
    };
}

function mapInventory(building: BaseBuilding): InventoryRow[] {
    const rows: InventoryRow[] = [];

    building.inventory.getCountByGoodId().forEach((count, itemId) => {
        const item = ItemRegistry[itemId];
        rows.push({
            itemId,
            name: item.name,
            count,
            unitValue: item.value,
        });
    });

    return rows;
}

export function mapEnvironmentView(building: BaseBuilding): EnvironmentView {
    const prefix = WORKER_LABEL_PREFIX[building.id] ?? DEFAULT_WORKER_PREFIX;

    return {
        id: building.id,
        name: building.static.name,
        funds: building.money,
        workers: building.workers.map((worker, index) => mapWorker(worker, index, prefix)),
        inventory: mapInventory(building),
    };
}

export function mapCityView(city: City): CityView {
    const buildings: CityBuildingSummary[] = [];

    city.buildings.forEach((building) => {
        buildings.push({
            id: building.id,
            name: building.static.name,
            funds: building.money,
            workerCount: building.workers.length,
        });
    });

    return {
        money: city.money,
        citizens: city.citizens_count,
        buildings,
    };
}
