export default class BaseModel {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    constructor(data: any);
    get exists(): boolean;
}
