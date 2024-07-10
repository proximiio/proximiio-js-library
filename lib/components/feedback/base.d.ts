export interface IFeedback {
    rating: number;
    language: string;
    reason?: string;
    session?: string;
}
export default class Feedback {
    rating: number;
    language: string;
    reason?: string;
    session?: string;
    constructor(data: IFeedback);
}
