export default class PersonModel {
    lat: number;
    lng: number;
    level: number;
    id?: string | number;
    constructor(data: any);
    updatePosition(data: any): void;
}
