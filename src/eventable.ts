export type Observer = (event?: string, data?: any, eventable?: Eventable) => any;

export class Eventable {
  _observers?: Observer[] = [];

  on(observer: Observer) {
    if (this._observers) {
      this._observers.push(observer);
    }
  }

  off(observer: Observer) {
    const index = this._observers ? this._observers.findIndex((o) => o === observer) : 0;
    if (index >= 0) {
      if (this._observers) {
        this._observers.splice(index, 1);
      }
    }
  }

  notify(event?: string, data?: any) {
    if (this._observers) {
      this._observers.forEach((observer) => observer(event, data, this));
    }
  }
}
