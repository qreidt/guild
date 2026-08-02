/**
 * The project's one source of randomness.
 *
 * `mulberry32` used to live inside `town-layout.ts`, where it scatters trees and
 * varies house dimensions deterministically from fixed seeds. It is lifted here
 * so the simulation and the scenery draw from one implementation rather than two
 * philosophies — see ADR 0005.
 *
 * `Math.random()` is deliberately absent from the simulation. A run that cannot
 * be replayed turns "the adventurer never finished this quest" into a story
 * instead of a report.
 */

/** A stream of numbers in [0, 1). Same shape the layout already passes around. */
export type RandomFn = () => number;

/**
 * Mulberry32 — a 32-bit PRNG: small, fast, and good enough for scattering trees
 * and rolling forage attempts. Same implementation, same results as before the
 * move; the town looks identical.
 */
export function mulberry32(seed: number): RandomFn {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * The world seed every actor stream is derived from. Arbitrary — its only job is
 * to be a fixed starting point that `seed <n>` can replace.
 */
const DEFAULT_WORLD_SEED = 0x5eed;

let world_seed = DEFAULT_WORLD_SEED;

/**
 * Bumped on every `setWorldSeed`. Live streams compare against it and rebuild
 * themselves, so pinning the seed mid-run actually re-pins the actors that
 * already exist — without a registry of every stream ever handed out.
 */
let generation = 0;

/** Pin the world seed. Every actor stream restarts from its new derived seed. */
export function setWorldSeed(seed: number): void {
    world_seed = seed >>> 0;
    generation++;
}

export function getWorldSeed(): number {
    return world_seed;
}

/**
 * Hash a string id into a seed, mixed with the world seed.
 *
 * The constants and the `imul`/xor shape are the layout's `cellSeed(i, j)`
 * pattern — a spatial hash of two integers — generalised to the characters of an
 * id. Two adventurers therefore get unrelated streams, and the same adventurer
 * gets the same stream on every run at the same world seed.
 */
export function actorSeed(id: string, seed: number = world_seed): number {
    let hash = 0x9e3779b9 ^ Math.imul(seed | 0, 73856093);
    for (let i = 0; i < id.length; i++) {
        hash = Math.imul(hash ^ id.charCodeAt(i), 19349663);
        hash = (hash ^ (hash >>> 13)) | 0;
    }

    return hash >>> 0;
}

/**
 * One actor's private stream of luck.
 *
 * Per-actor rather than global on purpose (ADR 0005): a single shared stream
 * would couple unrelated systems, so a future combat roll would perturb every
 * subsequent foraging result and a bug in one adventurer's luck could never be
 * isolated.
 *
 * A class rather than a bare closure so `setWorldSeed()` can reach streams that
 * were handed out before the seed was pinned — the console can `seed 7` at tick
 * 300 and the adventurer standing in the forest re-rolls from the new seed.
 */
export class RandomStream {
    private next_fn: RandomFn | null = null;
    private built_generation = -1;

    constructor(public readonly id: string) {}

    /** The next number in [0, 1). */
    public next(): number {
        if (this.built_generation !== generation) {
            this.next_fn = mulberry32(actorSeed(this.id));
            this.built_generation = generation;
        }

        return this.next_fn!();
    }

    /**
     * True with probability `p`. Always consumes exactly one number, including
     * at p <= 0 and p >= 1, so a change in the odds never shifts the stream out
     * from under everything that rolls after it.
     */
    public chance(p: number): boolean {
        return this.next() < p;
    }
}
