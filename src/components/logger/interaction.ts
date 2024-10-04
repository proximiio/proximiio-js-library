import { axios } from '../../common';

export default class InteractionLogger {
  interactionType: 'mapclick' | 'search' | 'select' | 'qr' | 'parkassist';
  targetElementType?: 'amenity' | 'feature' | 'amenity_category';
  targetElementId?: string;
  targetElementTitle?: string;
  targetElementAmenity?: string;
  targetElementAmenityCategory?: string;
  searchValue?: string;
  searchSuccess?: boolean;
  foundWithFuziness?: boolean;
  fuzinessResult?: string;
  kioskId?: string;
  kioskTitle?: string;
  metadata?: Record<string, string>;
  language?: string;
  session?: string;

  constructor(data: {
    interactionType: 'mapclick' | 'search' | 'select' | 'qr' | 'parkassist';
    targetElementType?: 'amenity' | 'feature' | 'amenity_category';
    targetElementId?: string;
    targetElementTitle?: string;
    targetElementAmenity?: string;
    targetElementAmenityCategory?: string;
    searchValue?: string;
    searchSuccess?: boolean;
    foundWithFuziness?: boolean;
    fuzinessResult?: string;
    kioskId?: string;
    kioskTitle?: string;
    metadata?: Record<string, string>;
    language?: string;
    session?: string;
  }) {
    this.interactionType = data.interactionType;
    this.targetElementType = data.targetElementType;
    this.targetElementId = data.targetElementId;
    this.targetElementTitle = data.targetElementTitle;
    this.targetElementAmenity = data.targetElementAmenity;
    this.targetElementAmenityCategory = data.targetElementAmenityCategory;
    this.searchValue = data.searchValue;
    this.searchSuccess = data.searchSuccess;
    this.foundWithFuziness = data.foundWithFuziness;
    this.fuzinessResult = data.fuzinessResult;
    this.kioskId = data.kioskId;
    this.kioskTitle = data.kioskTitle;
    this.metadata = data.metadata;
    this.language = data.language;
    this.session = data.session;

    this.logSelectedElement();
  }

  async saveLog() {
    try {
      await axios.post(`web-analytics/collector/interactions`, this);
    } catch (e) {
      console.error(`Log saving failed, ${e.message}`);
    }
  }

  logSelectedElement() {
    this.saveLog();
  }
}
