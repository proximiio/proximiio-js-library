import { axios } from '../../common';
import Feedback, { IFeedback } from './base';

export interface IStoreFeedback extends IFeedback {
  storeTitle: string;
}

export default class StoreFeedback extends Feedback {
  storeTitle: string;

  constructor(data: IStoreFeedback) {
    super(data);
    this.storeTitle = data.storeTitle;
  }

  async save() {
    try {
      await axios.post(`web-analytics/collector/store_feedback`, this);
    } catch (e) {
      console.log(`Feedback saving failed, ${e.message}`);
    }
  }
}
