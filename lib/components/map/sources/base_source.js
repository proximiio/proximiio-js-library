import { Eventable } from '../../../eventable';
export default class BaseSource extends Eventable {
    constructor(id, type) {
        super();
        this.id = id;
        this.type = type;
    }
    get source() {
        return {
            type: this.type,
        };
    }
}
