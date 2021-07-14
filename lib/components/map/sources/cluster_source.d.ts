import DataSource from './data_source';
import { FeatureCollection } from '../../../models/feature';
export default class ClusterSource extends DataSource {
    cluster: boolean;
    data: FeatureCollection;
    constructor();
}
