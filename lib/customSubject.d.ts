type Callback<T> = (value: T) => void;
export declare class CustomSubject<T> {
    private callbacks;
    next(value: T): void;
    subscribe(callback: Callback<T>): void;
}
export {};
