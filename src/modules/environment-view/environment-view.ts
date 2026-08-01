import type { Action } from "../../game/city/buildings/common/Action.ts";
import type { Worker } from "../../game/city/buildings/common/Worker.ts";
import { BuildingID, type BaseBuilding } from "../../game/city/buildings/common/Building.ts";
import type { City } from "../../game/city/City.ts";
import { AdventurerClass, AdventurerRank, type Adventurer } from "../../game/adventurer/Adventurer.ts";
import type { GoodLedger } from "../inventory/common.ts";
import { ItemRegistry } from "../items/registry.ts";
import { summarizeObjective } from "../quests/objectives.ts";
import type { Quest } from "../quests/common.ts";
import type {
    AdventurerView,
    CityBuildingSummary,
    CityView,
    EnvironmentView,
    InventoryRow,
    QuestRow,
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

/** Any ledger as rows — a building's shelf and an adventurer's pack alike. */
function mapInventory(ledger: GoodLedger): InventoryRow[] {
    const rows: InventoryRow[] = [];

    ledger.forEach((count, itemId) => {
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
        inventory: mapInventory(building.inventory.getCountByGoodId()),
    };
}

/**
 * One adventurer, read through the same lens as a worker: what they are doing,
 * how far along, and whether they are busy at all. Everything else — where they
 * are, what they hold, what they carry — is what a worker has no equivalent of.
 */
export function mapAdventurer(
    adventurer: Adventurer,
    quests: readonly Quest[],
): AdventurerView {
    const action = adventurer.active_action;
    const quest = quests.find((q) => q.id === adventurer.claimed_quest_id) ?? null;

    return {
        id: adventurer.gid,
        name: adventurer.name,
        class: AdventurerClass[adventurer.class],
        rank: AdventurerRank[adventurer.rank],
        location: adventurer.location,
        task: resolveTaskLabel(action),
        progress: workerProgress(action),
        status: action && !action.isDone() ? 'working' : 'idle',
        funds: adventurer.money,
        questId: adventurer.claimed_quest_id,
        questObjective: quest ? summarizeObjective(quest.objective) : null,
        // Emptied stacks stay in the ledger at zero. A building's shelf shows
        // them (knowing you have run out of lumber is useful); a pack does not —
        // "carrying 0 Bloodroot" reads as progress toward a quest that is
        // actually at nothing.
        carrying: mapInventory(adventurer.inventory.getCountByGoodId()).filter((row) => row.count > 0),
    };
}

/**
 * The roster. `quests` is read for one thing only — summarising the quest an
 * adventurer holds — so the roster still maps when a claimed quest has fallen
 * off the board.
 */
export function mapRoster(
    adventurers: readonly Adventurer[],
    quests: readonly Quest[],
): AdventurerView[] {
    return adventurers.map((adventurer) => mapAdventurer(adventurer, quests));
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

/**
 * The quest board, in posting order.
 *
 * `city` and `adventurers` are each read for one thing only — turning a
 * poster's `BuildingID` and a claimant's `ClaimantID` into display names — so
 * the board still maps cleanly when a poster is not (or is no longer) a
 * registered building, or when a claimant is not on the roster.
 */
export function mapQuestBoard(
    quests: readonly Quest[],
    city: City,
    adventurers: readonly Adventurer[] = [],
): QuestRow[] {
    return quests.map((quest) => ({
        id: quest.id,
        objective: summarizeObjective(quest.objective),
        location: quest.objective.location,
        reward: quest.reward,
        status: quest.status,
        poster: quest.poster,
        posterName: city.buildings.get(quest.poster)?.static.name ?? String(quest.poster),
        claimant: quest.claimant,
        claimantName: quest.claimant
            ? adventurers.find((a) => a.gid === quest.claimant)?.name ?? quest.claimant
            : null,
    }));
}
