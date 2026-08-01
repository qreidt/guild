import { BuildingID } from "../../../../game/city/buildings/common/Building.ts";
import {
    blockCenter,
    buildOccupancy,
    CELL,
    cellCenter,
    key,
    mergeHouses,
    occupantCovers,
    type Cell,
    type PlacedOccupant,
    type Terrain,
} from "./grid.ts";

/**
 * Authored "level design" for the 3D city-global view — now expressed on a
 * GRID. The town is built from integer cells (see `grid.ts`, `CELL = 3`): walls,
 * roads, houses and the main buildings each occupy a whole number of cells,
 * at most one occupant per cell (enforced by `buildOccupancy` at load). Trees are
 * non-occupying decoration. Pure data: no Vue, no `three`.
 *
 * Everything is computed ONCE at module load (fixed seed) so the reactive per-tick
 * re-render never rebuilds meshes — only the money/citizens overlay updates. The
 * exported render arrays (`WALL_BOXES`, `GROUND_PATCHES`, `HERO_PLOTS`,
 * `DECORATIVE_HOUSES`, `DENSE_HOUSES`, `TREES`) are derived from the grid so the
 * renderer stays "iterate data, not geometry".
 */

/**
 * COMPASS CONVENTION (per design decision — all directional names in this file
 * follow this; the 3D geometry itself does not depend on the labels):
 *
 *     NORTH = -x   (mountains / forest, behind the town)
 *     SOUTH = +x   (the sea — the open, wall-less side)
 *     EAST  = -z   (the farm fields)
 *     WEST  = +z
 */

export type Vec2 = [number, number]; // (x, z) on the ground plane
export type Vec3 = [number, number, number];

export interface HeroPlot {
    /** (x, z) plot centre (block centre + per-model offset). */
    position: Vec2;
    /** Size multiplier for the building model. */
    scale: number;
    /** Legend swatch colour. */
    tone: string;
}

export interface HouseTransform {
    id: string;
    position: Vec2;
    rotationY: number;
    width: number;
    depth: number;
    baseHeight: number;
    roofHeight: number;
    wallColor: string;
    roofColor: string;
}

export interface DenseHouseTransform {
    id: string;
    /** (x, z) centre of the 2×2 block. */
    position: Vec2;
    rotationY: number;
    seed: number;
}

export interface TreeTransform {
    id: string;
    position: Vec2;
    scale: number;
}

export interface BoxRect {
    id: string;
    /** Centre, including Y. */
    position: Vec3;
    /** (width, height, depth). */
    size: Vec3;
    rotationY?: number;
    color: string;
}

export interface GroundPatch {
    id: string;
    /** Centre, including a small Y lift to sit just above the grass. */
    position: Vec3;
    /** (width, depth) in the ground plane. */
    size: Vec2;
    color: string;
}

export interface Mountain {
    id: string;
    /** (x, z) base centre. */
    position: Vec2;
    radius: number;
    height: number;
}

export const PALETTE = {
    sky: "#bfe1ff",
    grass: "#74ad57",
    field: "#b98a4b",
    water: "#4a90d9",
    stone: "#a7adb3",
    towerStone: "#969ca2",
    path: "#cdb083",
    flag: "#d23b3b",
    trunk: "#7a5234",
    foliage: ["#3f7d3a", "#4e9a45", "#357a37"],
    /** House wall tints (stucco / timber). */
    walls: ["#e8dcc2", "#dccaa8", "#d6c19c", "#cdb89e", "#e3d2b0"],
    /** Roof tints (terracotta / red / brown). */
    roofs: ["#b4502c", "#9c3f24", "#c2613a", "#a8472a", "#8f3a20", "#6b4f3a"],
    /** Hero-model materials. */
    wood: "#8a6038",
    plank: "#caa86a",
    rock: "#8a8f94",
    ironDark: "#3b3f44",
    forge: "#ff6a00",
    /** Muted Manor Lords–style market-stall canopy cloths. */
    cloth: ["#e0d4b4", "#b5524a", "#caa14e", "#6f8fa8", "#7d8a5a", "#9c6b43"],
};

export const GROUND_SIZE = 100;

// ---------------------------------------------------------------------------
// Town extents — an INLAND rectangle, not a symmetric ring. The town grew north
// (-x) and sideways (±z) rather than uniformly: water starts at world x = 14,
// i.e. cell column i = 5, so growing south too would pull sea into the interior.
// Everything downstream (walls, gates, roads) derives from these four bounds.
// ---------------------------------------------------------------------------

/** Inclusive interior cell bounds — 13 × 13 buildable cells inside the walls. */
const INTERIOR_MIN_I = -8; // north-most interior row (world x = -24)
const INTERIOR_MAX_I = 4; // south-most interior row (world x = +12)
const INTERIOR_MIN_J = -6; // east-most interior column (world z = -18)
const INTERIOR_MAX_J = 6; // west-most interior column (world z = +18)

/** Wall lines, one cell outside the interior. South is open to the sea. */
const WALL_N_I = INTERIOR_MIN_I - 1; // -9  (world x = -27)
const WALL_S_I = INTERIOR_MAX_I + 1; // +5  (world x = +15) — corner towers only
const WALL_E_J = INTERIOR_MIN_J - 1; // -7  (world z = -21)
const WALL_W_J = INTERIOR_MAX_J + 1; // +7  (world z = +21)

// ---------------------------------------------------------------------------
// Background mountains (off-grid scenery to the NORTH/-x).
// ---------------------------------------------------------------------------

export const MOUNTAINS: Mountain[] = [
    { id: "mtn-1", position: [-38, -36], radius: 10, height: 16 },
    { id: "mtn-2", position: [-29, -43], radius: 7, height: 11 },
    { id: "mtn-3", position: [-44, -31], radius: 6.5, height: 10 },
];

// ---------------------------------------------------------------------------
// Main (hero) buildings — each a 2×2 plot anchored at its min-corner cell.
// Positions carried over from the old free-form layout (snapped, ≤ 1 cell drift).
// ---------------------------------------------------------------------------

interface BuildingPlot {
    anchor: Cell;
    /** Per-model centring nudge (x, z) in world units (some meshes are authored off-origin). */
    offset: Vec2;
    scale: number;
    tone: string;
}

const BUILDING_PLOTS: Partial<Record<BuildingID, BuildingPlot>> = {
    [BuildingID.Market]: { anchor: [2, 2], offset: [0, 0], scale: 1.0, tone: "#b5524a" },
    [BuildingID.BlackSmith]: { anchor: [-2, -2], offset: [0, 0], scale: 1.05, tone: "#3b3f44" },
    // Pushed 2 cells further north when the town grew — the north wall now sits
    // at i = -9, and the mill would otherwise be welded to the ramparts.
    [BuildingID.LumberMill]: { anchor: [-13, -1], offset: [-1.0, 0], scale: 1.0, tone: "#8a6038" },
    [BuildingID.IronMine]: { anchor: [-10, -9], offset: [0, 0], scale: 1.1, tone: "#8a8f94" },
    // Immediately inside the north gate on the forest side the herbs come from,
    // abutting the extended j=0 road — no trail extension needed. One of the
    // plots the expansion opened up.
    [BuildingID.Apothecary]: { anchor: [-8, 1], offset: [0, 0], scale: 1.0, tone: "#4a6b46" },
    // Kitty-corner to the Market plot [2, 2] on the open ground between the
    // market square and the west-band housing — where work is offered belongs
    // beside where goods are traded. Sits on the southern band (i = 3..4) that
    // stays clear of houses and trees, so nothing had to move to make room.
    [BuildingID.AdventurersGuild]: { anchor: [3, 4], offset: [0, 0], scale: 1.0, tone: "#c2a15a" },
};

/** Set of every cell covered by a hero building (2×2 each) — used by terrainAt. */
const BUILDING_CELLS = new Set<string>();
for (const plot of Object.values(BUILDING_PLOTS)) {
    const [i, j] = plot.anchor;
    BUILDING_CELLS.add(key(i, j));
    BUILDING_CELLS.add(key(i + 1, j));
    BUILDING_CELLS.add(key(i, j + 1));
    BUILDING_CELLS.add(key(i + 1, j + 1));
}

// ---------------------------------------------------------------------------
// Decorative authored structures (not game buildings) — the port + its storage
// warehouse, placed on the reserved southern band next to the sea and the farm.
// Each is a grid occupant (collision-checked, must be on grass) rendered by a
// model-keyed mesh in CityGlobalView3D.vue.
// ---------------------------------------------------------------------------

interface StructurePlot {
    anchor: Cell;
    w: number;
    d: number;
    /** Mesh key (see STRUCTURE_MODELS in the view). */
    model: string;
    /** Per-model centring nudge (x, z) in world units. */
    offset: Vec2;
    scale: number;
    rotationY: number;
}

const STRUCTURE_PLOTS: StructurePlot[] = [
    // Port — south edge by the sea (its dock + boat extend +x into the water).
    { anchor: [3, -2], w: 2, d: 2, model: "port", offset: [0, 0], scale: 1.0, rotationY: 0 },
    // Storage warehouse — just east of the port, nearest the SE corner / farm.
    { anchor: [3, -4], w: 2, d: 2, model: "storage", offset: [0, 0], scale: 1.0, rotationY: 0 },
];

// ---------------------------------------------------------------------------
// Roads — one cell per tile. Vertical gate path + horizontal E–W road.
// ---------------------------------------------------------------------------

const ROAD_CELLS: Cell[] = [];
// E–W road (row i=0): the full interior width, up to the EAST gate (0,-7) and
// the WEST gate (0,+7).
for (let j = INTERIOR_MIN_J; j <= INTERIOR_MAX_J; j++) ROAD_CELLS.push([0, j]);
// N–S road (column j=0): from the NORTH gate (i=-9) down toward the sea (i=+4).
for (let i = INTERIOR_MIN_I; i <= INTERIOR_MAX_I; i++) if (i !== 0) ROAD_CELLS.push([i, 0]);

// A narrower TRAIL from the north gate (-9,0) out to the LumberMill's edge. It
// stops at i=-11: the mill covers (-13,0) and (-12,0), and a trail plate under a
// building would NOT throw (terrainAt reports "grass" for building cells before
// it checks roads) — it would silently z-fight at y = 0.03.
const TRAIL_CELLS: Cell[] = [];
for (let i = WALL_N_I; i >= -11; i--) TRAIL_CELLS.push([i, 0]);

// terrainAt treats roads AND the trail as non-buildable + tree-free; only ROAD_CELLS
// render as full tiles (the trail renders as narrow plates below).
const ROAD_SET = new Set([...ROAD_CELLS, ...TRAIL_CELLS].map(([i, j]) => key(i, j)));
const isRoad = (i: number, j: number): boolean => ROAD_SET.has(key(i, j));

// ---------------------------------------------------------------------------
// Terrain — every cell classified. Only grass is buildable.
// ---------------------------------------------------------------------------

interface Rect {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}
// Sea (south/+x), two farm fields (east/-z). The fields sit ~6 units further
// EAST than the original plates so the enlarged town's east wall (j = -7, world
// z = -21) lands on grass instead of crossing farmland. NOTE: these rects and the
// `field-1` / `field-2` plates in GROUND_PATCHES are two sources of truth for the
// same rectangles — move them together or terrain and render disagree.
const SEA: Rect = { x0: 14, x1: 36, z0: -32, z1: 32 };
const FIELD_1: Rect = { x0: -15, x1: 1, z0: -33.5, z1: -24.5 };
const FIELD_2: Rect = { x0: 3, x1: 15, z0: -33, z1: -25 };
const inRect = (x: number, z: number, r: Rect): boolean => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const onMountain = (x: number, z: number): boolean =>
    MOUNTAINS.some((m) => Math.hypot(m.position[0] - x, m.position[1] - z) < m.radius);

export function terrainAt(i: number, j: number): Terrain {
    const [x, z] = cellCenter(i, j);
    // A hero building claims its cells as grass (it wins over an underlying road).
    if (BUILDING_CELLS.has(key(i, j))) return "grass";
    if (isRoad(i, j)) return "road";
    if (inRect(x, z, SEA)) return "water";
    if (inRect(x, z, FIELD_1) || inRect(x, z, FIELD_2)) return "field";
    if (onMountain(x, z)) return "mountain";
    return "grass";
}

// ---------------------------------------------------------------------------
// Perimeter walls — one tile per cell on the interior rectangle's outer ring.
// N/E/W gates open; corner + bastion towers; the SOUTH (sea, +x) side is open
// save for its corner towers.
// ---------------------------------------------------------------------------

interface WallCell {
    cell: Cell;
    variant: "wall" | "tower";
    axis?: "x" | "z";
}

function buildWallCells(): WallCell[] {
    const cells: WallCell[] = [];

    // Four corner towers.
    cells.push({ cell: [WALL_N_I, WALL_E_J], variant: "tower" });
    cells.push({ cell: [WALL_N_I, WALL_W_J], variant: "tower" });
    cells.push({ cell: [WALL_S_I, WALL_E_J], variant: "tower" });
    cells.push({ cell: [WALL_S_I, WALL_W_J], variant: "tower" });

    // North wall (i = -9), runs along z; central gate at j=0, bastions at j=±1.
    for (let j = INTERIOR_MIN_J; j <= INTERIOR_MAX_J; j++) {
        if (j === 0) continue; // gate
        cells.push(
            Math.abs(j) === 1
                ? { cell: [WALL_N_I, j], variant: "tower" }
                : { cell: [WALL_N_I, j], variant: "wall", axis: "z" },
        );
    }

    // East wall (j = -7), runs along x; central gate at i=0, bastions at i=±1.
    for (let i = INTERIOR_MIN_I; i <= INTERIOR_MAX_I; i++) {
        if (i === 0) continue; // gate
        cells.push(
            Math.abs(i) === 1
                ? { cell: [i, WALL_E_J], variant: "tower" }
                : { cell: [i, WALL_E_J], variant: "wall", axis: "x" },
        );
    }

    // West wall (j = +7), runs along x; central gate at i=0, no bastions.
    for (let i = INTERIOR_MIN_I; i <= INTERIOR_MAX_I; i++) {
        if (i === 0) continue; // gate
        cells.push({ cell: [i, WALL_W_J], variant: "wall", axis: "x" });
    }

    // South side (i = +5): open to the sea — no wall tiles (corners above only).

    return cells;
}

const WALL_CELLS = buildWallCells();

// Wall mesh dimensions (carried over from the old continuous walls).
const WALL_T = 0.6;
const WALL_H = 2.4;
const TOWER_H = 3.6;
const TOWER_W = 2.0;

// ---------------------------------------------------------------------------
// Houses — 1×1 grass cells; clean 2×2 blocks merge into a dense "5+" mesh.
// Hand-authored interior cluster (kept clear of plots, roads and gates).
// ---------------------------------------------------------------------------

// A denser interior, confined to i ∈ [-4, 2] so the southern rows (i ≥ 3) stay
// open toward the sea for the port. Clear of the road plus (i=0, j=0), the
// Market plot (2..3, 2..3) and the Blacksmith plot (-2..-1, -2..-1).
//
// Housing is deliberately MODEST relative to the enlarged interior: the northern
// band (i ≤ -5) is the reserve the expansion was built for — the Apothecary plot
// at [-8, 1] plus room for future buildings — and every house cell costs free 2×2
// anchors there. That band is dressed with (non-occupying) trees instead.
const HOUSE_CELLS: Cell[] = [
    // NW quadrant (north-west): i=-4..-1, j=1..4
    [-4, 1], [-3, 1], [-2, 1], [-1, 1],
    [-4, 2], [-3, 2], [-2, 2],
    [-4, 3], [-3, 3], [-2, 3], [-1, 3],
    [-4, 4], [-3, 4], [-2, 4], [-1, 4],
    // NE quadrant (north-east): i=-4..-1, j=-4..-1 (minus the Blacksmith plot)
    [-4, -1], [-3, -1],
    [-4, -2], [-3, -2],
    [-4, -3], [-3, -3], [-2, -3], [-1, -3],
    [-4, -4], [-3, -4], [-2, -4], [-1, -4],
    // SW quadrant (south-west): i=1..2, j=1..4 (minus the Market plot)
    [1, 1], [1, 2], [1, 3], [1, 4],
    [2, 1], [2, 4],
    // SE quadrant (south-east): i=1..2, j=-4..-1
    [1, -1], [1, -2], [1, -3], [1, -4],
    [2, -1], [2, -2], [2, -3], [2, -4],
    // NEW west band (j=5..6) opened by the expansion — two 5+ blocks flanking the
    // road out to the west gate, so the widened town does not read as bare grass.
    // NEVER extend this into (-8,1) (-7,1) (-8,2) (-7,2): the Apothecary plot.
    [-2, 5], [-1, 5], [-2, 6], [-1, 6],
    [1, 5], [2, 5], [1, 6], [2, 6],
];

const { dense: DENSE_ANCHORS, singles: HOUSE_SINGLES } = mergeHouses(HOUSE_CELLS);

// ---------------------------------------------------------------------------
// Assemble + assert the single-occupant invariant (throws at load on conflict).
// ---------------------------------------------------------------------------

const PLACED: PlacedOccupant[] = [
    ...WALL_CELLS.map((w) => ({
        anchor: w.cell,
        w: 1,
        d: 1,
        occ: { kind: "wall" as const, variant: w.variant, axis: w.axis },
    })),
    ...Object.entries(BUILDING_PLOTS).map(([id, plot]) => ({
        anchor: plot.anchor,
        w: 2,
        d: 2,
        occ: { kind: "building" as const, id: id as BuildingID },
    })),
    ...STRUCTURE_PLOTS.map((s) => ({
        anchor: s.anchor,
        w: s.w,
        d: s.d,
        occ: { kind: "structure" as const, model: s.model },
    })),
    ...DENSE_ANCHORS.map((anchor) => ({ anchor, w: 2, d: 2, occ: { kind: "house-dense" as const } })),
    ...HOUSE_SINGLES.map((anchor) => ({ anchor, w: 1, d: 1, occ: { kind: "house" as const } })),
];

const OCCUPANCY = buildOccupancy(PLACED, terrainAt);

// ---------------------------------------------------------------------------
// Deterministic PRNG (stable scatter, no flicker across renders).
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick<T>(rnd: () => number, arr: T[]): T {
    return arr[Math.floor(rnd() * arr.length)];
}

/** Stable per-cell seed. */
const cellSeed = (i: number, j: number): number => (Math.imul(i | 0, 73856093) ^ Math.imul(j | 0, 19349663) ^ 0x9e3779b9) >>> 0;

// ---------------------------------------------------------------------------
// Derived RENDER ARRAYS (consumed by CityGlobalView3D.vue).
// ---------------------------------------------------------------------------

/** The hero buildings, keyed by id (position = block centre + offset). */
export const HERO_PLOTS: Partial<Record<BuildingID, HeroPlot>> = Object.fromEntries(
    Object.entries(BUILDING_PLOTS).map(([id, plot]) => {
        const [cx, cz] = blockCenter(plot.anchor[0], plot.anchor[1], 2, 2);
        return [id, { position: [cx + plot.offset[0], cz + plot.offset[1]] as Vec2, scale: plot.scale, tone: plot.tone }];
    }),
) as Partial<Record<BuildingID, HeroPlot>>;

export interface StructureTransform {
    id: string;
    model: string;
    position: Vec2;
    rotationY: number;
    scale: number;
}

/** Decorative authored structures (port, storage), ready to render. */
export const STRUCTURES: StructureTransform[] = STRUCTURE_PLOTS.map((s) => {
    const [cx, cz] = blockCenter(s.anchor[0], s.anchor[1], s.w, s.d);
    return {
        id: `struct-${s.model}-${s.anchor[0]}-${s.anchor[1]}`,
        model: s.model,
        position: [cx + s.offset[0], cz + s.offset[1]],
        rotationY: s.rotationY,
        scale: s.scale,
    };
});

/** Per-cell wall + tower boxes (BoxRect, ready to render). */
export const WALL_BOXES: BoxRect[] = WALL_CELLS.map((w) => {
    const [cx, cz] = cellCenter(w.cell[0], w.cell[1]);
    if (w.variant === "tower") {
        return {
            id: `tower-${w.cell[0]}-${w.cell[1]}`,
            position: [cx, TOWER_H / 2, cz],
            size: [TOWER_W, TOWER_H, TOWER_W],
            color: PALETTE.towerStone,
        };
    }
    const size: Vec3 = w.axis === "z" ? [WALL_T, WALL_H, CELL] : [CELL, WALL_H, WALL_T];
    return { id: `wall-${w.cell[0]}-${w.cell[1]}`, position: [cx, WALL_H / 2, cz], size, color: PALETTE.stone };
});

/** Sea + fields + per-cell road tiles (flat plates just above the grass). */
export const GROUND_PATCHES: GroundPatch[] = [
    { id: "water", position: [25, 0.06, 0], size: [22, 64], color: PALETTE.water },
    { id: "field-1", position: [-7, 0.04, -29], size: [16, 9], color: PALETTE.field },
    { id: "field-2", position: [9, 0.04, -29], size: [12, 8], color: PALETTE.field },
    // Road tiles — one per road cell, dropped where a building covers them (C9).
    ...ROAD_CELLS.filter(([i, j]) => !occupantCovers(OCCUPANCY, i, j)).map(([i, j]) => {
        const [cx, cz] = cellCenter(i, j);
        return { id: `road-${i}-${j}`, position: [cx, 0.03, cz] as Vec3, size: [CELL, CELL] as Vec2, color: PALETTE.path };
    }),
    // Narrow trail tiles to the LumberMill — a thin E–W strip (smaller than a road).
    ...TRAIL_CELLS.map(([i, j]) => {
        const [cx, cz] = cellCenter(i, j);
        return { id: `trail-${i}-${j}`, position: [cx, 0.03, cz] as Vec3, size: [CELL, 1.4] as Vec2, color: PALETTE.path };
    }),
];

/** Single houses (1×1) — deterministic dims/colours per cell. */
export const DECORATIVE_HOUSES: HouseTransform[] = HOUSE_SINGLES.map(([i, j]) => {
    const rnd = mulberry32(cellSeed(i, j));
    const [cx, cz] = cellCenter(i, j);
    return {
        id: `house-${i}-${j}`,
        position: [cx, cz],
        rotationY: Math.round(rnd() * 3) * (Math.PI / 2) + (rnd() - 0.5) * 0.25,
        width: 1.3 + rnd() * 0.8,
        depth: 1.3 + rnd() * 0.8,
        baseHeight: 1.0 + rnd() * 0.9,
        roofHeight: 0.8 + rnd() * 0.6,
        wallColor: pick(rnd, PALETTE.walls),
        roofColor: pick(rnd, PALETTE.roofs),
    };
});

/** Dense "5+" housing blocks (2×2) — centre of each merged block. */
export const DENSE_HOUSES: DenseHouseTransform[] = DENSE_ANCHORS.map(([i, j]) => {
    const [cx, cz] = blockCenter(i, j, 2, 2);
    return { id: `dense-${i}-${j}`, position: [cx, cz], rotationY: 0, seed: cellSeed(i, j) };
});

// ---------------------------------------------------------------------------
// Trees — non-occupying decoration. Generated near the old forest/edge regions,
// then snapped to cells and filtered: grass/field terrain, no occupant, and a
// clearance ring around the outside hero buildings (Mill / Mine).
// ---------------------------------------------------------------------------

const LUMBER_CENTER: Vec2 = blockCenter(-13, -1, 2, 2) as Vec2; // [-37.5, -1.5]
const MINE_CENTER: Vec2 = blockCenter(-10, -9, 2, 2) as Vec2; // [-28.5, -25.5]
const OUTSIDE_HEROES: Vec2[] = [LUMBER_CENTER, MINE_CENTER];

/** True when a cell lies inside the walled interior rectangle. */
const insideWalls = (i: number, j: number): boolean =>
    i >= INTERIOR_MIN_I && i <= INTERIOR_MAX_I && j >= INTERIOR_MIN_J && j <= INTERIOR_MAX_J;

function treeCellOk(x: number, z: number, allowInterior = false): boolean {
    const i = Math.round(x / CELL);
    const j = Math.round(z / CELL);
    const t = terrainAt(i, j);
    if (t !== "grass" && t !== "field") return false;
    if (occupantCovers(OCCUPANCY, i, j)) return false;
    // Only the deliberate interior-greenery band may plant inside the walls. The
    // forest bands sit just beyond them and would otherwise seed a wood in town.
    if (!allowInterior && insideWalls(i, j)) return false;
    if (OUTSIDE_HEROES.some((p) => Math.hypot(p[0] - x, p[1] - z) < 5)) return false;
    // Keep the southern interior band (toward the sea and the port) open.
    if (i >= 3 && insideWalls(i, j)) return false;
    return true;
}

function buildTrees(seed: number): TreeTransform[] {
    const rnd = mulberry32(seed);
    const trees: TreeTransform[] = [];
    const tooClose = (x: number, z: number, min: number): boolean =>
        trees.some((t) => Math.hypot(t.position[0] - x, t.position[1] - z) < min);
    const push = (x: number, z: number, scale: number, allowInterior = false): void => {
        if (!treeCellOk(x, z, allowInterior)) return;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale });
    };

    // Forest belt just beyond the north wall (i = -9, world x = -27) — it used to
    // start at x = -23, which now falls INSIDE the enlarged town.
    let made = 0;
    let attempts = 0;
    while (made < 34 && attempts < 1800) {
        attempts++;
        const x = -29 - rnd() * 9; // -29 .. -38
        const z = (rnd() * 2 - 1) * 24;
        if (tooClose(x, z, 1.6)) continue;
        const before = trees.length;
        push(x, z, 0.85 + rnd() * 0.7);
        if (trees.length > before) made++;
    }

    // A dense scatter out toward the mountains (north), likewise pushed clear of
    // the new wall line.
    made = 0;
    attempts = 0;
    while (made < 36 && attempts < 3600) {
        attempts++;
        const x = -29 - rnd() * 17; // -29 .. -46
        const z = -13 - rnd() * 30; // -13 .. -43
        if (tooClose(x, z, 2.0)) continue;
        const before = trees.length;
        push(x, z, 0.8 + rnd() * 0.7);
        if (trees.length > before) made++;
    }

    // Greenery inside the walls — widened from world ±12 to the full 13×13
    // interior. The northern band is deliberately left unhoused (it is the
    // reserve for the Apothecary and future buildings), so this is what keeps it
    // reading as parkland rather than bare grass. Trees do not occupy cells, so
    // they cost nothing in buildable 2×2 anchors.
    made = 0;
    attempts = 0;
    while (made < 18 && attempts < 1400) {
        attempts++;
        const x = (INTERIOR_MIN_I + rnd() * (INTERIOR_MAX_I - INTERIOR_MIN_I)) * CELL; // -24 .. 12
        const z = (INTERIOR_MIN_J + rnd() * (INTERIOR_MAX_J - INTERIOR_MIN_J)) * CELL; // -18 .. 18
        if (tooClose(x, z, 2.2)) continue;
        const before = trees.length;
        push(x, z, 0.7 + rnd() * 0.45, true);
        if (trees.length > before) made++;
    }

    // Edges of the map (skipping the sea side, south/+x).
    made = 0;
    attempts = 0;
    while (made < 30 && attempts < 3000) {
        attempts++;
        const x = (rnd() * 2 - 1) * 46; // -46 .. 46
        const z = (rnd() * 2 - 1) * 46;
        if (Math.hypot(x, z) < 34) continue; // only out near the edges
        if (tooClose(x, z, 2.6)) continue;
        const before = trees.length;
        push(x, z, 0.8 + rnd() * 0.7);
        if (trees.length > before) made++;
    }

    return trees;
}

export const TREES: TreeTransform[] = buildTrees(1344);
