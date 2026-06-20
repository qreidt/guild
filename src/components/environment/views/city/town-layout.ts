import { BuildingID } from "../../../../game/city/buildings/common/Building.ts";

/**
 * Authored "level design" for the 3D city-global view — the single place to tune
 * the Kingdoms & Castles–style village. Pure data: no Vue, no `three`.
 *
 * Everything here is computed ONCE at module load (fixed seed) so the reactive
 * per-tick re-render never rebuilds meshes — only the money/citizens overlay
 * updates. Tweak the camera/palette/scatter to iterate on the look; nothing in
 * this file reads or mutates engine state.
 */

export type Vec2 = [number, number]; // (x, z) on the ground plane
export type Vec3 = [number, number, number];

export interface HeroPlot {
    /** (x, z) plot centre. */
    position: Vec2;
    /** Size multiplier — hero buildings are bigger than decorative houses. */
    scale: number;
    roofColor: string;
    wallColor: string;
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
};

/** Half-extent of the walled town (walls sit at ±TOWN_HALF). */
const TOWN_HALF = 15;
export const GROUND_SIZE = 72;

/**
 * Hero plot centres (x, z), shared by HERO_PLOTS and the scatter so houses /
 * trees stay clear of them. The Market anchors the FRONT of the town (nearest
 * the camera, along +x+z); the Blacksmith sits inside; the Lumber Mill and Iron
 * Mine are placed OUTSIDE the west wall by the forest. The farm fields stay in
 * the background to the north (see buildGroundPatches).
 */
const MARKET_POS: Vec2 = [8, 8];
const BLACKSMITH_POS: Vec2 = [-5, -2];
const LUMBER_POS: Vec2 = [-19, 7];
const MINE_POS: Vec2 = [-20, -7];

/** Buildings inside vs outside the walls — used to keep the scatter clear. */
const INSIDE_HEROES: Vec2[] = [MARKET_POS, BLACKSMITH_POS];
const OUTSIDE_HEROES: Vec2[] = [LUMBER_POS, MINE_POS];

/**
 * The 4 real buildings, placed at fixed plots. Their `name` / order still come
 * from `CityView.buildings`; this only supplies where and how big each renders.
 * Keyed by id so render order is irrelevant.
 */
export const HERO_PLOTS: Partial<Record<BuildingID, HeroPlot>> = {
    [BuildingID.Market]: { position: MARKET_POS, scale: 2.1, roofColor: "#b5532f", wallColor: "#e7d9ba" },
    [BuildingID.BlackSmith]: { position: BLACKSMITH_POS, scale: 1.7, roofColor: "#8f3a20", wallColor: "#cdb79a" },
    [BuildingID.LumberMill]: { position: LUMBER_POS, scale: 1.7, roofColor: "#7a4a2a", wallColor: "#cda877" },
    [BuildingID.IronMine]: { position: MINE_POS, scale: 1.7, roofColor: "#5b6066", wallColor: "#b9c0c7" },
};

/** Deterministic PRNG so the scatter is stable across renders (no flicker). */
function mulberry32(seed: number): () => number {
    let s = seed;
    return function () {
        s |= 0;
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick<T>(rnd: () => number, arr: T[]): T {
    return arr[Math.floor(rnd() * arr.length)];
}

/** True if (x, z) is within `min` of any of the given points. */
function nearAny(x: number, z: number, points: Vec2[], min: number): boolean {
    return points.some((p) => Math.hypot(p[0] - x, p[1] - z) < min);
}

/** Decorative houses clustered inside the walls, behind/around the Market. */
function buildDecorativeHouses(seed: number): HouseTransform[] {
    const rnd = mulberry32(seed);
    const houses: HouseTransform[] = [];
    const target = 28;
    let attempts = 0;

    while (houses.length < target && attempts < target * 30) {
        attempts++;
        const x = (rnd() * 2 - 1) * 13;
        const z = (rnd() * 2 - 1) * 13;

        // Round the town off so it doesn't fill the square wall corners.
        if (Math.hypot(x, z) > 13.5) continue;
        // Plaza around the inside hero buildings (Market, Blacksmith).
        if (nearAny(x, z, INSIDE_HEROES, 5)) continue;
        // Keep the front clear so the Market reads as THE front building.
        if (x + z > 12.5) continue;
        // Keep the two main streets (gate path + east-west road) clear.
        if (Math.abs(x) < 2.2 && z > -1.5 && z < 15) continue;
        if (Math.abs(z) < 2.2 && Math.abs(x) < 12) continue;
        // Don't crowd already-placed houses.
        if (houses.some((h) => Math.hypot(h.position[0] - x, h.position[1] - z) < 2.5)) continue;

        houses.push({
            id: `house-${houses.length}`,
            position: [x, z],
            rotationY: Math.round(rnd() * 3) * (Math.PI / 2) + (rnd() - 0.5) * 0.25,
            width: 1.2 + rnd() * 0.9,
            depth: 1.2 + rnd() * 0.9,
            baseHeight: 1.0 + rnd() * 0.9,
            roofHeight: 0.8 + rnd() * 0.6,
            wallColor: pick(rnd, PALETTE.walls),
            roofColor: pick(rnd, PALETTE.roofs),
        });
    }

    return houses;
}

/** A forest belt west of the town plus a little greenery inside the walls. */
function buildTrees(seed: number): TreeTransform[] {
    const rnd = mulberry32(seed);
    const trees: TreeTransform[] = [];
    const tooClose = (x: number, z: number, min: number): boolean =>
        trees.some((t) => Math.hypot(t.position[0] - x, t.position[1] - z) < min);

    // Forest belt further out west, sitting behind the Lumber Mill / Iron Mine.
    let attempts = 0;
    while (trees.length < 24 && attempts < 700) {
        attempts++;
        const x = -24 - rnd() * 9; // -24 .. -33
        const z = (rnd() * 2 - 1) * 26;
        if (tooClose(x, z, 1.7)) continue;
        if (nearAny(x, z, OUTSIDE_HEROES, 4.5)) continue;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale: 0.85 + rnd() * 0.7 });
    }

    // A few inside for greenery.
    attempts = 0;
    while (trees.length < 30 && attempts < 300) {
        attempts++;
        const x = (rnd() * 2 - 1) * 12;
        const z = (rnd() * 2 - 1) * 12;
        if (Math.hypot(x, z) > 13) continue;
        if (x + z > 12.5) continue; // keep the Market's front clear
        if (nearAny(x, z, INSIDE_HEROES, 5)) continue;
        if (tooClose(x, z, 2.4)) continue;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale: 0.7 + rnd() * 0.45 });
    }

    return trees;
}

/** Perimeter wall (gate gap on the south, camera-facing side) + corner towers. */
function buildWalls(): BoxRect[] {
    const W = TOWN_HALF;
    const T = 0.6; // thickness
    const H = 2.4; // height
    const span = 2 * W + T;
    const gate = 2.6; // half-width of the south gate gap
    const segHalf = (W - gate) / 2;
    const segLen = W - gate;
    const segCentre = gate + segLen / 2;

    const stone = PALETTE.stone;
    const walls: BoxRect[] = [
        { id: "wall-n", position: [0, H / 2, -W], size: [span, H, T], color: stone },
        { id: "wall-e", position: [W, H / 2, 0], size: [T, H, span], color: stone },
        { id: "wall-w", position: [-W, H / 2, 0], size: [T, H, span], color: stone },
        // South wall split around the gate.
        { id: "wall-s-l", position: [-segCentre, H / 2, W], size: [segLen, H, T], color: stone },
        { id: "wall-s-r", position: [segCentre, H / 2, W], size: [segLen, H, T], color: stone },
    ];

    const towerH = 3.6;
    const towerW = 2.0;
    for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
            walls.push({
                id: `tower-${sx}-${sz}`,
                position: [sx * W, towerH / 2, sz * W],
                size: [towerW, towerH, towerW],
                color: PALETTE.towerStone,
            });
        }
    }

    return walls;
}

/** Water (east coast), farmland (north), and dirt paths — flat plates over grass. */
function buildGroundPatches(): GroundPatch[] {
    return [
        { id: "water", position: [25, 0.06, 0], size: [22, 64], color: PALETTE.water },
        { id: "field-1", position: [-7, 0.04, -23], size: [16, 9], color: PALETTE.field },
        { id: "field-2", position: [9, 0.04, -23], size: [12, 8], color: PALETTE.field },
        // Main paths: gate -> centre, and an east-west street.
        { id: "path-v", position: [0, 0.03, 7.5], size: [3, 15], color: PALETTE.path },
        { id: "path-h", position: [0, 0.03, 0], size: [24, 3], color: PALETTE.path },
    ];
}

const SEED = 1337;
export const DECORATIVE_HOUSES: HouseTransform[] = buildDecorativeHouses(SEED);
export const TREES: TreeTransform[] = buildTrees(SEED + 7);
export const WALL_BOXES: BoxRect[] = buildWalls();
export const GROUND_PATCHES: GroundPatch[] = buildGroundPatches();
