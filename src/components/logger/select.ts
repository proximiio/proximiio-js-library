import { axios } from '../../common';

export default class SelectLogger {
  clickedElementId: string;
  clickedElementTitle: string;
  clickedElementType: 'amenity' | 'feature' | 'amenity_category';
  source: 'manual' | 'urlParam' | 'qr';
  kioskId?: string;
  metadata?: Record<string, string>;

  constructor(data: {
    clickedElementId: string;
    clickedElementTitle: string;
    clickedElementType: 'amenity' | 'feature' | 'amenity_category';
    source: 'manual' | 'urlParam' | 'qr';
    kioskId?: string;
    metadata?: Record<string, string>;
  }) {
    this.clickedElementId = data.clickedElementId;
    this.clickedElementTitle = data.clickedElementTitle;
    this.clickedElementType = data.clickedElementType;
    this.source = data.source;
    this.kioskId = data.kioskId;
    this.metadata = data.metadata;

    this.logSelectedElement();
  }

  async saveLog() {
    try {
      await axios.post(`web-analytics/collector/clicks`, this);
    } catch (e) {
      console.error(`Log saving failed, ${e.message}`);
    }
  }

  logSelectedElement() {
    this.saveLog();
  }
}
