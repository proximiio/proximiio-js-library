import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';
export default class GeoJSONSource extends DataSource {
    language: string;
    constructor(features: FeatureCollection);
    fetch(data: any): void;
    create(feature: Feature): void;
    update(feature: Feature): void;
    delete(id: string): void;
    mapLanguage(): void;
    mapFeatureLanguage(feature: Feature, language: string): void;
    query(query: string, level?: number): Feature[];
    get(id: string): Feature;
    getInternal(id: string): Feature;
    get collection(): FeatureCollection;
}
