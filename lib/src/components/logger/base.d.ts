export default class BaseLogger {
    id: string;
    organization_id: string;
    organization_name?: string;
    visitor_id: string;
    createdAt: Date;
    constructor(data: any);
}
