import DataSource from './data_source';
import { FeatureCollection } from '../../../models/feature';
export default class GeoJSONSource extends DataSource {
    constructor(features) {
        super('main');
        this.language = 'en';
    }
    fetch(data) {
        this.data = new FeatureCollection(data);
        this.mapLanguage();
    }
    create(feature) {
        this.data.features.push(feature);
    }
    update(feature) {
        const foundIndex = this.data.features.findIndex((x) => x.id === feature.id || x.properties.id === feature.id);
        this.data.features[foundIndex] = feature;
    }
    delete(id) {
        const foundIndex = this.data.features.findIndex((x) => x.id === id || x.properties.id === id);
        this.data.features.splice(foundIndex, 1);
    }
    mapLanguage() {
        const features = this.data.features.filter((f) => typeof f.properties.title_i18n === 'object');
        features.forEach((feature) => this.mapFeatureLanguage(feature, this.language));
    }
    mapFeatureLanguage(feature, language) {
        if (typeof feature.properties.title_i18n === 'string') {
            feature.properties.title_i18n = JSON.parse(feature.properties.title_i18n);
        }
        if (typeof feature.properties.title_i18n === 'object') {
            feature.properties.title = feature.properties.title_i18n[language]
                ? feature.properties.title_i18n[language]
                : feature.properties.title;
        }
    }
    query(query, level = 0) {
        return this.data.features.filter((f) => f.properties.title && f.properties.title.toLowerCase().match(query.toLowerCase()));
    }
    get(id) {
        return this.data.features.find((f) => f.id === id);
    }
    getInternal(id) {
        return this.data.features.find((f) => f.properties.id === id);
    }
    get collection() {
        return {
            type: 'FeatureCollection',
            features: this.data.features.map((f) => f.json),
        };
    }
}
