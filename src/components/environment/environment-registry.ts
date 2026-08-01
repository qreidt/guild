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
 *
 * The Adventurers' Guild is the one entry that does not use the shared shell —
 * it has no workers and no inventory, and its quest board replaces both. It is
 * still registered here because it is read-only, which is what this registry is
 * for.
 */
export const environmentArtRegistry: Partial<Record<BuildingID, Component>> = {
    [BuildingID.BlackSmith]: defineAsyncComponent(() => import('./views/BlacksmithView2D.vue')),
    [BuildingID.LumberMill]: defineAsyncComponent(() => import('./views/LumberMillView2D.vue')),
    [BuildingID.IronMine]: defineAsyncComponent(() => import('./views/IronMineView2D.vue')),
    [BuildingID.Apothecary]: defineAsyncComponent(() => import('./views/ApothecaryView2D.vue')),
    [BuildingID.AdventurersGuild]: defineAsyncComponent(() => import('./views/AdventurersGuildView2D.vue')),
};
