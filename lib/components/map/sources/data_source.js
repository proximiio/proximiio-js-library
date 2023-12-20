import BaseSource from './base_source';
import { FeatureCollection } from '../../../models/feature';
export default class DataSource extends BaseSource {
    constructor(id, data) {
        super(id, 'geojson');
        this.cluster = false;
        this.clusterRadius = 50;
        this.clusterMaxZoom = 19;
        this.isEditable = true;
        this.data = data || new FeatureCollection({});
    }
    get source() {
        return {
            type: this.type,
            data: this.data,
            cluster: this.cluster,
            clusterMaxZoom: this.clusterMaxZoom,
            clusterRadius: this.clusterRadius,
        };
    }
}
