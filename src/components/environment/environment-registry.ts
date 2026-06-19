import { defineAsyncComponent, type Component } from "vue";
import { BuildingID } from "../../game/city/buildings/common/Building.ts";

/**
 * Single source of truth for `BuildingID -> art component`.
 *
 * Components are async-imported so heavy art dependencies (e.g. the 3D arm's
 * `three`) are only fetched when that view actually renders. Adding a new
 * environment art view is one component + one entry here — no view-model change.
 *
 * IronMine / LumberMill intentionally have no entry in this slice: they resolve
 * to `GenericEnvironmentView`. They become registry entries in the rollout
 * cycles.
 */
export const environmentArtRegistry: Partial<Record<BuildingID, Component>> = {
    [BuildingID.BlackSmith]: defineAsyncComponent(() => import('./views/BlacksmithView2D.vue')),
};
