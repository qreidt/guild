import type { ItemID } from "../items/id.ts";
import type { BuildingID } from "../../game/city/buildings/common/Building.ts";

/**
 * Render-agnostic contract for the read-only environment interfaces.
 *
 * These are plain, serializable-shaped DTOs with no methods and no engine
 * references. Any renderer (2D SVG/CSS, 3D Three.js, or plain HTML) consumes
 * the same shapes so the data layer stays shared and only the art differs.
 */

export type WorkerStatus = 'idle' | 'working';

export interface WorkerView {
    /** Index-based label, e.g. "Smith 1". */
    label: string;
    /** Raw action identifier (constructor.name), null when idle. */
    task: string | null;
    /** Clamped to 0..1. */
    progress: number;
    status: WorkerStatus;
}

export interface InventoryRow {
    itemId: ItemID;
    /** ItemRegistry[itemId].name */
    name: string;
    count: number;
    /** ItemRegistry[itemId].value */
    unitValue: number;
}

export interface EnvironmentView {
    id: BuildingID;
    /** building.static.name */
    name: string;
    /** building.money */
    funds: number;
    workers: WorkerView[];
    inventory: InventoryRow[];
}

export interface CityBuildingSummary {
    id: BuildingID;
    name: string;
    funds: number;
    workerCount: number;
}

export interface CityView {
    /** city.money */
    money: number;
    /** city.citizens_count */
    citizens: number;
    buildings: CityBuildingSummary[];
}
