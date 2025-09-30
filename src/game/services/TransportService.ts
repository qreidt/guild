import {BaseBuilding} from "../city/buildings/common/Building.ts";
import {Inventory} from "../common/Inventory.ts";
import {City} from "../city/City.ts";

export type Location = BaseBuilding | City;

export type Transport = {
    origin: Location;
    destination: Location;
    ticks_remaining: number;
    content: Inventory;
};

export class TransportService {
    public transports: Transport[] = [];

    /**
     * Move registered transports and reduce a tick.
     *
     * If the tick reaches 0. Move the content to the destination.
     *
     * Filter the list to leave only active transports.
     *
     * @private
     */
    public tickTransports(): void {
        for (let i = 0; i < this.transports.length; i++) {
            const transport = this.transports[i];
            transport.ticks_remaining--;

            if (transport.ticks_remaining > 0) {
                continue;
            }

            transport.content.items.forEach((amount, item) => {
                transport.destination.inventory.putItem(item, amount);
            });
        }

        this.transports = this.transports.filter(({ticks_remaining}) => ticks_remaining > 0);
    }

    public newTransport(transport: Transport): void {
        this.transports.push(transport);
    }
}