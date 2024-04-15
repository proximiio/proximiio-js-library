import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';
import { convertToRTL } from '../../../common';

export default class GeoJSONSource extends DataSource {
  language = 'en';

  constructor(features: FeatureCollection) {
    super('main');
  }

  fetch(data: any) {
    this.data = new FeatureCollection(data);
    this.mapLanguage();
  }

  create(feature: Feature) {
    this.data.features.push(feature);
  }

  update(feature: Feature) {
    const foundIndex = this.data.features.findIndex((x) => x.id === feature.id || x.properties.id === feature.id);
    this.data.features[foundIndex] = feature;
  }

  delete(id: string) {
    const foundIndex = this.data.features.findIndex((x) => x.id === id || x.properties.id === id);
    this.data.features.splice(foundIndex, 1);
  }

  mapLanguage() {
    const features = this.data.features.filter((f) => typeof f.properties.title_i18n === 'object');
    features.forEach((feature) => this.mapFeatureLanguage(feature, this.language));
  }

  mapFeatureLanguage(feature: Feature, language: string) {
    if (typeof feature.properties.title_i18n === 'string') {
      feature.properties.title_i18n = JSON.parse(feature.properties.title_i18n);
    }

    if (typeof feature.properties.title_i18n === 'object') {
      feature.properties.title = feature.properties.title_i18n[language]
        ? feature.properties.title_i18n[language]
        : feature.properties.title;
    }

    if (language === 'ar') {
      //feature.properties.title = convertToRTL(feature.properties.title);
    }
  }

  query(query: string, level = 0) {
    return this.data.features.filter(
      (f) => f.properties.title && f.properties.title.toLowerCase().match(query.toLowerCase()),
    );
  }

  get(id: string) {
    return this.data.features.find((f) => f.id === id) as Feature;
  }

  getInternal(id: string) {
    return this.data.features.find((f) => f.properties.id === id) as Feature;
  }

  get collection() {
    return {
      type: 'FeatureCollection',
      features: this.data.features.map((f) => f.json),
    } as FeatureCollection;
  }
}
