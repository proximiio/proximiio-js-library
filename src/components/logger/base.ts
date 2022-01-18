import { v4 as uuidv4 } from 'uuid';

export default class BaseLogger {
  id: string;
  organization_id: string;
  organization_name?: string;
  visitor_id: string;
  createdAt: Date;

  constructor(data: any) {
    this.id = data.id ? data.id : `${uuidv4()}:${uuidv4()}`;
    this.organization_id = data.organization_id;
    this.organization_name = data.organization_name;
    this.visitor_id = data.visitor_id ? data.visitor_id : uuidv4();
    this.createdAt = data.createdAt ? data.createdAt : new Date();
  }
}
