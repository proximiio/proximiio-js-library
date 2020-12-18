import BaseSource from './base_source';
import { FeatureCollection } from '../../../models/feature';

export default class DataSource extends BaseSource {
  data: FeatureCollection;
  cluster = false;
  clusterRadius = 50;
  clusterMaxZoom = 19;
  isEditable = true;

  constructor(id: string, data?: FeatureCollection) {
    super(id, 'geojson');
    this.data = data || new FeatureCollection({});
  }

  get source() {
    return {
      type: this.type,
      data: this.data,
      cluster: this.cluster,
      clusterMaxZoom: this.clusterMaxZoom,
      clusterRadius: this.clusterRadius
    };
  }
}
