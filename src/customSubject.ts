type Callback<T> = (value: T) => void;

export class CustomSubject<T> {
  private callbacks: Callback<T>[] = [];

  next(value: T) {
    this.callbacks.forEach((callback) => {
      callback(value);
    });
  }

  subscribe(callback: Callback<T>) {
    this.callbacks.push(callback);
  }
}
