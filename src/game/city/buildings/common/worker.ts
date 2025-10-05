import type {BaseAction} from "./BaseAction.ts";

/**
 * Is available in the building inside an array
 * Using a worker allows the building to have many workers in parallel.
 */
export class Worker {
    public active_action: null | BaseAction = null;

    public tick(): void {
        if (! this.active_action) {
            return;
        }

        this.active_action.tick();
    }

    public isAvailable() {
        return this.active_action === null
            || this.active_action.isDone();
    }
}