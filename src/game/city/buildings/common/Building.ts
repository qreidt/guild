import {Inventory} from "../../../common/Inventory.ts";
import type {InventoryItemID} from "../../../common/Inventory.ts";
import {City} from "../../City.ts";
import type {BaseAction} from "./BaseAction.ts";
import {Worker} from "./worker.ts";

export type Recipe = {
    ingredients?: Map<InventoryItemID, number>,
    product: Map<InventoryItemID, number>,
};

export enum BuildingID {
    BlackSmith = 'BlackSmith',
    IronMine = 'IronMine',
    LumberMill = 'LumberMill',
}

export abstract class BaseBuilding {
    public abstract level: number;
    public abstract money: number;
    public abstract produces: Recipe[];
    public abstract buys: InventoryItemID[];

    // ToDo Replicate to BlackSmith and Mine
    // public abstract actions: BaseAction[];

    public inventory: Inventory = new Inventory();

    public workers: Worker[] = [];
    public active_action: null | BaseAction = null;

    public handleTick(_city: City): void {
        const availableWorkers = this.workers.filter((w) => w.isAvailable());

        if (availableWorkers.length > 0) {
            for (const worker of availableWorkers) {
                worker.active_action = this.chooseNextAction();
                worker.active_action.start();
            }
        }

        for (const worker of this.workers) {
            worker.tick();
        }
    }

    protected abstract chooseNextAction(): BaseAction;

    public produce(recipe_id: number): void {
        const recipe = this.produces[recipe_id];

        if (! this.validateRecipeIngredients(recipe)) {
            return; // ToDo throw exception?
        }

        // Remove the ingredients from the inventory
        if (recipe.ingredients) {
            recipe.ingredients.forEach((amount, item) => {
                this.inventory.retrieveItem(item, amount);
            });
        }

        // Put the product in the inventory
        recipe.product.forEach((amount, item) => {
            this.inventory.putItem(item, amount);
        });
    }

    /**
     * Validate if the inventory contains the ingredients required to produce the recipe
     *
     * @param recipe
     * @private
     */
    private validateRecipeIngredients(recipe: Recipe): boolean {
        if (! recipe.ingredients) {
            return true;
        }

        for (const [item, required_amount] of recipe.ingredients.entries()) {
            if ((this.inventory.getItem(item) - required_amount) < 0) {
                return false;
            }
        }

        return true;
    }
}
