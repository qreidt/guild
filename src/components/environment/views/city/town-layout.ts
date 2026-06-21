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
    /** Size multiplier for the building model (authored at real size, ~1.0). */
    scale: number;
    /** Legend swatch colour (each model defines its own materials internally). */
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

/** Half-extent of the walled town (walls sit at ±TOWN_HALF). */
const TOWN_HALF = 15;
export const GROUND_SIZE = 100;

/**
 * Hero plot centres (x, z), shared by HERO_PLOTS and the scatter so houses /
 * trees stay clear of them. The Market anchors the FRONT of the town (nearest
 * the camera, along +x+z); the Blacksmith sits inside; the Lumber Mill and Iron
 * Mine are placed OUTSIDE the west wall by the forest. The farm fields stay in
 * the background to the north (see buildGroundPatches).
 */
const MARKET_POS: Vec2 = [8, 8];
const BLACKSMITH_POS: Vec2 = [-5, -2];
const LUMBER_POS: Vec2 = [-30, -17];
const MINE_POS: Vec2 = [-28, -26];

/** Buildings inside vs outside the walls — used to keep the scatter clear. */
const INSIDE_HEROES: Vec2[] = [MARKET_POS, BLACKSMITH_POS];
const OUTSIDE_HEROES: Vec2[] = [LUMBER_POS, MINE_POS];

/**
 * The 4 real buildings, placed at fixed plots. Their `name` / order still come
 * from `CityView.buildings`; this only supplies where and how big each renders.
 * Keyed by id so render order is irrelevant.
 */
export const HERO_PLOTS: Partial<Record<BuildingID, HeroPlot>> = {
    [BuildingID.Market]: { position: MARKET_POS, scale: 1.0, tone: "#b5524a" },
    [BuildingID.BlackSmith]: { position: BLACKSMITH_POS, scale: 1.05, tone: "#3b3f44" },
    [BuildingID.LumberMill]: { position: LUMBER_POS, scale: 1.0, tone: "#8a6038" },
    [BuildingID.IronMine]: { position: MINE_POS, scale: 1.1, tone: "#8a8f94" },
};

/** Background mountain range out to the north-west (-x, -z). */
export const MOUNTAINS: Mountain[] = [
    { id: "mtn-1", position: [-38, -36], radius: 10, height: 16 },
    { id: "mtn-2", position: [-29, -43], radius: 7, height: 11 },
    { id: "mtn-3", position: [-44, -31], radius: 6.5, height: 10 },
];

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

/** True if (x, z) lies on (or right next to) a mountain footprint. */
function onMountain(x: number, z: number): boolean {
    return MOUNTAINS.some((m) => Math.hypot(m.position[0] - x, m.position[1] - z) < m.radius + 1.5);
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
    const blocked = (x: number, z: number): boolean =>
        nearAny(x, z, OUTSIDE_HEROES, 5.5) || onMountain(x, z);

    // Forest belt west of the town.
    let made = 0;
    let attempts = 0;
    while (made < 34 && attempts < 1800) {
        attempts++;
        const x = -23 - rnd() * 11; // -23 .. -34
        const z = (rnd() * 2 - 1) * 24;
        if (tooClose(x, z, 1.6) || blocked(x, z)) continue;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale: 0.85 + rnd() * 0.7 });
        made++;
    }

    // North-west: a dense scatter out toward the mountains.
    made = 0;
    attempts = 0;
    while (made < 36 && attempts < 3600) {
        attempts++;
        const x = -18 - rnd() * 28; // -18 .. -46
        const z = -13 - rnd() * 30; // -13 .. -43
        if (tooClose(x, z, 2.0) || blocked(x, z)) continue;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale: 0.8 + rnd() * 0.7 });
        made++;
    }

    // Greenery inside the walls.
    made = 0;
    attempts = 0;
    while (made < 12 && attempts < 800) {
        attempts++;
        const x = (rnd() * 2 - 1) * 12;
        const z = (rnd() * 2 - 1) * 12;
        if (Math.hypot(x, z) > 13) continue;
        if (x + z > 12.5) continue; // keep the Market's front clear
        if (nearAny(x, z, INSIDE_HEROES, 5)) continue;
        if (tooClose(x, z, 2.2)) continue;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale: 0.7 + rnd() * 0.45 });
        made++;
    }

    // Edges of the map (skipping the water side to the east / south-east).
    made = 0;
    attempts = 0;
    while (made < 30 && attempts < 3000) {
        attempts++;
        const x = (rnd() * 2 - 1) * 46; // -46 .. 46
        const z = (rnd() * 2 - 1) * 46;
        if (Math.hypot(x, z) < 34) continue; // only out near the edges
        if (x > 12 && z > -32) continue; // keep clear of the water
        if (blocked(x, z)) continue;
        if (tooClose(x, z, 2.6)) continue;
        trees.push({ id: `tree-${trees.length}`, position: [x, z], scale: 0.8 + rnd() * 0.7 });
        made++;
    }

    return trees;
}

/**
 * Partial perimeter wall: open on the water (east) side, with a south gate, a
 * central north gate (bastion-framed) and an NE gate (posts + lintel). All four
 * corners have towers.
 */
function buildWalls(): BoxRect[] {
    const W = TOWN_HALF;
    const T = 0.6; // thickness
    const H = 2.4; // height
    const stone = PALETTE.stone;
    const boxes: BoxRect[] = [];

    // South wall (z = +W) split around the central gate.
    const sGate = 2.6;
    const sLen = W - sGate;
    const sCentre = sGate + sLen / 2;
    boxes.push({ id: "wall-s-l", position: [-sCentre, H / 2, W], size: [sLen, H, T], color: stone });
    boxes.push({ id: "wall-s-r", position: [sCentre, H / 2, W], size: [sLen, H, T], color: stone });

    // West wall (x = -W), full length.
    boxes.push({ id: "wall-w", position: [-W, H / 2, 0], size: [T, H, 2 * W], color: stone });

    // North wall (z = -W): a central gate plus the NE gate -> three segments.
    const cGate = 3; // central gate half-width
    const neA = 8; // NE gate start
    const neB = 12; // NE gate end
    boxes.push({ id: "wall-n-w", position: [(-W - cGate) / 2, H / 2, -W], size: [W - cGate, H, T], color: stone });
    boxes.push({ id: "wall-n-m", position: [(cGate + neA) / 2, H / 2, -W], size: [neA - cGate, H, T], color: stone });
    boxes.push({ id: "wall-n-e", position: [(neB + W) / 2, H / 2, -W], size: [W - neB, H, T], color: stone });

    // (East wall removed — the city opens onto the water.)

    // Corner towers (all four — the NW corner is closed again).
    const towerH = 3.6;
    const towerW = 2.0;
    const corners: Vec2[] = [
        [-W, W], // SW
        [W, W], // SE
        [W, -W], // NE
        [-W, -W], // NW
    ];
    for (const [tx, tz] of corners) {
        boxes.push({ id: `tower-${tx}-${tz}`, position: [tx, towerH / 2, tz], size: [towerW, towerH, towerW], color: PALETTE.towerStone });
    }

    // Central north gate: bastion towers flanking the opening.
    boxes.push({ id: "gate-bastion-l", position: [-cGate, towerH / 2, -W], size: [towerW, towerH, towerW], color: PALETTE.towerStone });
    boxes.push({ id: "gate-bastion-r", position: [cGate, towerH / 2, -W], size: [towerW, towerH, towerW], color: PALETTE.towerStone });

    // NE gate: posts + a timber lintel across the gap.
    const gateH = 2.8;
    boxes.push({ id: "ne-post-a", position: [neA, gateH / 2, -W], size: [0.8, gateH, 0.9], color: PALETTE.towerStone });
    boxes.push({ id: "ne-post-b", position: [neB, gateH / 2, -W], size: [0.8, gateH, 0.9], color: PALETTE.towerStone });
    boxes.push({ id: "ne-lintel", position: [(neA + neB) / 2, gateH + 0.15, -W], size: [neB - neA + 0.9, 0.35, 0.9], color: PALETTE.wood });

    return boxes;
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
