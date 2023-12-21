export class CustomSubject {
    constructor() {
        this.callbacks = [];
    }
    next(value) {
        this.callbacks.forEach((callback) => {
            callback(value);
        });
    }
    subscribe(callback) {
        this.callbacks.push(callback);
    }
}
