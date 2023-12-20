import DataSource from './data_source';
import { FeatureCollection } from '../../../models/feature';
export default class SyntheticSource extends DataSource {
    constructor(data) {
        super('synthetic');
        this.data = data || new FeatureCollection({});
    }
    get(id) {
        return this.data.features.find((f) => f.properties.id === id);
    }
}
