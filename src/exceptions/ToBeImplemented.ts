export class ToBeImplemented extends Error {
    constructor(feature: null|string = null) {
        super(`To be implemented${feature ? `: ${feature}` : ''}`);
    }
}