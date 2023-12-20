export default class BaseModel {
    constructor(data) {
        this.id = data.id || (data.properties ? data.properties.id : undefined);
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
    get exists() {
        return typeof this.id !== 'undefined';
    }
}
