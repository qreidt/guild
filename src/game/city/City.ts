export default class City {
    public citizens_count: number;
    public money: number;

    constructor(citizens: number, money: number) {
        this.citizens_count = citizens;
        this.money = money;
    }
}