export class Eventable {
    constructor() {
        this._observers = [];
    }
    on(observer) {
        if (this._observers) {
            this._observers.push(observer);
        }
    }
    off(observer) {
        const index = this._observers ? this._observers.findIndex((o) => o === observer) : 0;
        if (index >= 0) {
            if (this._observers) {
                this._observers.splice(index, 1);
            }
        }
    }
    notify(event, data) {
        if (this._observers) {
            this._observers.forEach((observer) => observer(event, data, this));
        }
    }
}
