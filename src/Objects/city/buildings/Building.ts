import type {BaseGood} from "../../common/Good.ts";
import {Inventory} from "../../common/Inventory.ts";

type Recipe = {
    ingredients?: Map<typeof BaseGood, number>,
    product: Map<typeof BaseGood, number>,
};

export abstract class BaseBuilding {
    public abstract level: number;
    public abstract money: number;
    public abstract produces: Recipe[];
    public abstract buys: (typeof BaseGood)[];

    public inventory: Inventory = new Inventory();

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
