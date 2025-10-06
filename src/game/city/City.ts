import {BaseBuilding, BuildingID} from "./buildings/common/Building.ts";
import {IronMine} from "./buildings/IronMine.ts";
import {BlackSmith} from "./buildings/BlackSmith.ts";
import {Inventory} from "../common/Inventory.ts";
import {TransportService} from "../services/TransportService.ts";
import {LumberMill} from "./buildings/LumberMill.ts";

export class City {
    public citizens_count: number;
    public money: number;

    public buildings: Map<BuildingID, BaseBuilding>;

    public transportService: TransportService = new TransportService();

    public inventory: Inventory = new Inventory();

    constructor(citizens: number, money: number) {
        this.citizens_count = citizens;
        this.money = money;

        this.buildings = new Map<BuildingID, BaseBuilding>([
            [BuildingID.LumberMill, new LumberMill()],
            [BuildingID.IronMine, new IronMine()],
            // [BuildingID.BlackSmith, new BlackSmith()],
        ]);
    }

    handleTick(): void {
        // this.transportService.tickTransports();

        // Let every building work before managing things in the city
        this.tickBuildings();
    }

    private tickBuildings(): void {
        this.buildings.forEach((building) => {
            building.handleTick(this);
        });
    }
}
