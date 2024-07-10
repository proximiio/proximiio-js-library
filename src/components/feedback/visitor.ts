import { axios } from '../../common';
import Feedback, { IFeedback } from './base';

export default class VisitorFeedback extends Feedback {
  constructor(data: IFeedback) {
    super(data);
  }

  async save() {
    try {
      await axios.post(`web-analytics/collector/visitor_feedback`, this);
    } catch (e) {
      console.log(`Feedback saving failed, ${e.message}`);
    }
  }
}
