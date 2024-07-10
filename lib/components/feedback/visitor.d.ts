import Feedback, { IFeedback } from './base';
export default class VisitorFeedback extends Feedback {
    constructor(data: IFeedback);
    save(): Promise<void>;
}
