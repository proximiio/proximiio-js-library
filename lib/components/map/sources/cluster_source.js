import DataSource from './data_source';
import { FeatureCollection } from '../../../models/feature';
export default class ClusterSource extends DataSource {
    constructor() {
        super('clusters');
        this.cluster = true;
        this.data = new FeatureCollection({});
    }
}
