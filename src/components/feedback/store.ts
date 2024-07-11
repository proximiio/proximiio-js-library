import { axios } from '../../common';
import Feedback, { IFeedback } from './base';

export interface IStoreFeedback extends IFeedback {
  storeTitle: string;
  poi_id: string;
}

export default class StoreFeedback extends Feedback {
  storeTitle: string;
  poi_id: string;

  constructor(data: IStoreFeedback) {
    super(data);
    this.storeTitle = data.storeTitle;
    this.poi_id = data.poi_id;
  }

  async save() {
    try {
      await axios.post(`web-analytics/collector/store_feedback`, this);
    } catch (e) {
      console.log(`Feedback saving failed, ${e.message}`);
    }
  }
}
