import { computed, reactive, type ComputedRef, type Ref } from "vue";
import GameControllerSingleton, { GameController } from "../../game/controllers/GameController.ts";
import type { BuildingID } from "../../game/city/buildings/common/Building.ts";
import {
    mapCityView,
    mapEnvironmentView,
    mapQuestBoard,
} from "../../modules/environment-view/environment-view.ts";
import type { CityView, EnvironmentView, QuestRow } from "../../modules/environment-view/types.ts";
import questService from "../../modules/quests/quest.service.ts";

/**
 * The only place reactivity lives. Views derive from the same reactive
 * controller proxy `App.vue` uses (`reactive(GameControllerSingleton)`).
 *
 * `reactive()` caches its proxy, so this is the exact same proxy the footer's
 * `c.nextTick()` / `c.resume()` mutate — engine writes therefore invalidate
 * these computeds.
 *
 * The mechanism is a per-tick **heartbeat**: each computed reads
 * `controller.tick` (which increments every tick) and then re-derives the view
 * from state resolved *fresh*. We do not rely on deep-reactive propagation
 * through nested building / worker / external-inventory state during the
 * auto-run loop — touching `tick` re-runs the whole mapper every tick, which
 * re-reads everything (including `inventory.getCountByGoodId()`) fresh.
 */
const controller = reactive(GameControllerSingleton) as GameController;

export function useEnvironmentView(
    buildingId: Ref<BuildingID | null>,
): ComputedRef<EnvironmentView | null> {
    return computed(() => {
        void controller.tick; // per-tick heartbeat
        const id = buildingId.value;
        if (!id) {
            return null;
        }

        const building = controller.city.buildings.get(id);
        return building ? mapEnvironmentView(building) : null;
    });
}

export function useCityView(): ComputedRef<CityView> {
    return computed(() => {
        void controller.tick; // per-tick heartbeat
        return mapCityView(controller.city);
    });
}

/**
 * The quest board. Read straight from `questService` rather than through a
 * building: the board is a module service and the Adventurers' Guild is only
 * where it is displayed (ADR 0002).
 */
export function useQuestBoard(): ComputedRef<QuestRow[]> {
    return computed(() => {
        void controller.tick; // per-tick heartbeat
        return mapQuestBoard(questService.getAll(), controller.city);
    });
}
