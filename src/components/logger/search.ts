import { axios } from '../../common';

export default class SearchLogger {
  searchValue: string;
  success: boolean;
  resultId?: string;
  resultTitle?: string;
  resultAmenity?: string;
  resultAmenityCategory?: string;
  foundWithFuziness?: boolean;
  fuzinessResult?: string;
  kioskId?: string;
  metadata?: Record<string, string>;
  language?: string;
  session?: string;

  constructor(data: {
    searchValue: string;
    success: boolean;
    resultId?: string;
    resultTitle?: string;
    resultAmenity?: string;
    resultAmenityCategory?: string;
    foundWithFuziness?: boolean;
    fuzinessResult?: string;
    kioskId?: string;
    metadata?: Record<string, string>;
    language?: string;
    session?: string;
  }) {
    this.searchValue = data.searchValue;
    this.success = data.success;
    this.resultId = data.resultId;
    this.resultTitle = data.resultTitle;
    this.resultAmenity = data.resultAmenity;
    this.resultAmenityCategory = data.resultAmenityCategory;
    this.foundWithFuziness = data.foundWithFuziness;
    this.fuzinessResult = data.fuzinessResult;
    this.kioskId = data.kioskId;
    this.metadata = data.metadata;
    this.language = data.language;
    this.session = data.session;

    this.logSearch();
  }

  async saveLog() {
    try {
      await axios.post(`web-analytics/collector/searches`, this);
    } catch (e) {
      console.error(`Log saving failed, ${e.message}`);
    }
  }

  logSearch() {
    this.saveLog();
  }
}
