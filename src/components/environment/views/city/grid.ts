import type { BuildingID } from "../../../../game/city/buildings/common/Building.ts";

/**
 * Grid model for the 3D city-global map — the single place cell math, the house
 * dense-merge and the single-occupant assertion live. Pure data/logic: no Vue,
 * no `three`.
 *
 * The whole ground plane is a square grid of `CELL`-unit cells. A cell is an
 * integer index pair `(i, j)`; its world centre is `cellCenter(i, j)`. Walls,
 * roads, houses and main buildings occupy a whole number of cells (≤ 1 occupant
 * per cell, enforced by `buildOccupancy`); trees are non-occupying decoration.
 *
 * COMPASS (unchanged — see `town-layout.ts`): N = -x, S = +x (sea), E = -z, W = +z.
 */

/** World units per grid cell. Walls at world ±15 land on cell index ±5 exactly. */
export const CELL = 3;
/** Inclusive index bounds — covers the ±48 range of the 100-unit ground plane. */
export const GRID_MIN = -16;
export const GRID_MAX = 16;

/** Integer grid indices `(i, j)`. */
export type Cell = readonly [number, number];

export type Terrain = "grass" | "water" | "field" | "mountain" | "road";

export type Occupant =
    | { kind: "wall"; variant: "wall" | "tower"; axis?: "x" | "z" }
    | { kind: "building"; id: BuildingID } // 2×2, anchored at this cell
    | { kind: "house" } // 1×1
    | { kind: "house-dense" } // 2×2, anchored at this cell
    | { kind: "structure"; model: string }; // decorative authored structure (e.g. port), any footprint

/** A `w×d` block of cells anchored at its min-corner `(−x, −z)` cell. */
export interface PlacedOccupant {
    anchor: Cell;
    w: number;
    d: number;
    occ: Occupant;
}

/** World centre of a single cell. */
export function cellCenter(i: number, j: number): [number, number] {
    return [i * CELL, j * CELL];
}

/** World centre of a `w×d` block anchored at min-corner cell `(i, j)`. */
export function blockCenter(i: number, j: number, w: number, d: number): [number, number] {
    return [(i + (w - 1) / 2) * CELL, (j + (d - 1) / 2) * CELL];
}

/** Stable string key for a cell, for Set/Map membership. */
export const key = (i: number, j: number): string => `${i},${j}`;

/** Only grass cells accept building/house occupants. */
export function isBuildable(t: Terrain): boolean {
    return t === "grass";
}

/** True for the occupant kinds that must sit on buildable (grass) terrain. */
function needsBuildable(occ: Occupant): boolean {
    return (
        occ.kind === "building" ||
        occ.kind === "house" ||
        occ.kind === "house-dense" ||
        occ.kind === "structure"
    );
}

/** Enumerate every cell a placed occupant covers. */
function cellsOf(p: PlacedOccupant): Cell[] {
    const [i, j] = p.anchor;
    const out: Cell[] = [];
    for (let di = 0; di < p.w; di++) {
        for (let dj = 0; dj < p.d; dj++) {
            out.push([i + di, j + dj]);
        }
    }
    return out;
}

/**
 * Greedy 2×2 tiling of a set of house cells. Deterministic: scans cells in
 * ascending `(j, i)` order and, for each still-unconsumed cell, emits a dense
 * 2×2 block when `(i,j)`, `(i+1,j)`, `(i,j+1)`, `(i+1,j+1)` are all present and
 * unconsumed; otherwise the cell stays a single house. Pure — same input always
 * yields the same output.
 */
export function mergeHouses(houseCells: Cell[]): { dense: Cell[]; singles: Cell[] } {
    const present = new Set(houseCells.map(([i, j]) => key(i, j)));
    const consumed = new Set<string>();
    const dense: Cell[] = [];
    const singles: Cell[] = [];

    const ordered = [...houseCells].sort((a, b) => a[1] - b[1] || a[0] - b[0]);

    for (const [i, j] of ordered) {
        if (consumed.has(key(i, j))) continue;

        const block: Cell[] = [
            [i, j],
            [i + 1, j],
            [i, j + 1],
            [i + 1, j + 1],
        ];
        const formsBlock = block.every(([bi, bj]) => present.has(key(bi, bj)) && !consumed.has(key(bi, bj)));

        if (formsBlock) {
            for (const [bi, bj] of block) consumed.add(key(bi, bj));
            dense.push([i, j]);
        } else {
            consumed.add(key(i, j));
            singles.push([i, j]);
        }
    }

    return { dense, singles };
}

/**
 * Build the cell→occupant map and validate the single-occupant invariant.
 * Throws (dev-time fail-fast) if a cell is claimed twice, or if a
 * building/house/house-dense occupant lands on non-buildable terrain. Walls and
 * towers are exempt from the terrain check — they sit on the perimeter.
 */
export function buildOccupancy(
    placed: PlacedOccupant[],
    terrainAt: (i: number, j: number) => Terrain,
): Map<string, PlacedOccupant> {
    const map = new Map<string, PlacedOccupant>();

    for (const p of placed) {
        for (const [i, j] of cellsOf(p)) {
            const k = key(i, j);
            const existing = map.get(k);
            if (existing) {
                throw new Error(
                    `[grid] cell ${k} claimed by both ${describe(existing.occ)} and ${describe(p.occ)}`,
                );
            }
            if (needsBuildable(p.occ) && !isBuildable(terrainAt(i, j))) {
                throw new Error(
                    `[grid] ${describe(p.occ)} placed on non-buildable terrain '${terrainAt(i, j)}' at cell ${k}`,
                );
            }
            map.set(k, p);
        }
    }

    return map;
}

/** True if any occupant covers cell `(i, j)` in the given occupancy map. */
export function occupantCovers(occupancy: Map<string, PlacedOccupant>, i: number, j: number): boolean {
    return occupancy.has(key(i, j));
}

function describe(occ: Occupant): string {
    if (occ.kind === "building") return `building:${occ.id}`;
    if (occ.kind === "structure") return `structure:${occ.model}`;
    if (occ.kind === "wall") return `wall:${occ.variant}`;
    return occ.kind;
}
