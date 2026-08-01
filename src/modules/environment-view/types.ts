import type { ItemID } from "../items/id.ts";
import type { BuildingID } from "../../game/city/buildings/common/Building.ts";
import type { ClaimantID, QuestID, QuestStatus } from "../quests/common.ts";
import type { Location } from "../world/location.ts";

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

/**
 * One line of the quest board. The objective arrives pre-summarised by its
 * resolver, so the board renders a `hunt` quest the day one exists without the
 * panel learning a second shape.
 */
export interface QuestRow {
    id: QuestID;
    /** Resolver-produced one-liner, e.g. "Gather 10 × Bloodroot". */
    objective: string;
    /** Where the work happens. */
    location: Location;
    /** Escrowed gold, already paid out of the poster's wallet. */
    reward: number;
    status: QuestStatus;
    /** The building that posted it. */
    poster: BuildingID;
    /** Its display name, or the raw id when it is not a city building. */
    posterName: string;
    /** The adventurer that claimed it; null while Open. */
    claimant: ClaimantID | null;
}
