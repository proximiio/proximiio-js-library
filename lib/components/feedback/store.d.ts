import Feedback, { IFeedback } from './base';
export interface IStoreFeedback extends IFeedback {
    storeTitle: string;
    poi_id: string;
}
export default class StoreFeedback extends Feedback {
    storeTitle: string;
    poi_id: string;
    constructor(data: IStoreFeedback);
    save(): Promise<void>;
}
