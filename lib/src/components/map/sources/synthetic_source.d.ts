import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';
export default class SyntheticSource extends DataSource {
    data: FeatureCollection;
    constructor(data: FeatureCollection);
    get(id: string): Feature;
}
