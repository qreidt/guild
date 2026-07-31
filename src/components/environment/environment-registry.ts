import { defineAsyncComponent, type Component } from "vue";
import { BuildingID } from "../../game/city/buildings/common/Building.ts";

/**
 * Single source of truth for `BuildingID -> art component`.
 *
 * Components are async-imported so heavy art dependencies (e.g. the 3D arm's
 * `three`) are only fetched when that view actually renders. Adding a new
 * environment art view is one component + one entry here — no view-model change.
 *
 * All production environments share the `BuildingInterior2D` shell; only
 * the banner art and accent theme differ. The Market keeps its own `MarketPanel`
 * (with controls) and is deliberately absent here.
 */
export const environmentArtRegistry: Partial<Record<BuildingID, Component>> = {
    [BuildingID.BlackSmith]: defineAsyncComponent(() => import('./views/BlacksmithView2D.vue')),
    [BuildingID.LumberMill]: defineAsyncComponent(() => import('./views/LumberMillView2D.vue')),
    [BuildingID.IronMine]: defineAsyncComponent(() => import('./views/IronMineView2D.vue')),
    [BuildingID.Apothecary]: defineAsyncComponent(() => import('./views/ApothecaryView2D.vue')),
};
