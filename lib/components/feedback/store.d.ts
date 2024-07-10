import Feedback, { IFeedback } from './base';
export interface IStoreFeedback extends IFeedback {
    storeTitle: string;
}
export default class StoreFeedback extends Feedback {
    storeTitle: string;
    constructor(data: IStoreFeedback);
    save(): Promise<void>;
}
