import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';

export default class SyntheticSource extends DataSource {
  data: FeatureCollection;

  constructor(data: FeatureCollection) {
    super('synthetic');
    this.data = data || new FeatureCollection({});
  }

  get(id: string) {
    return this.data.features.find(f => f.properties.id === id) as Feature;
  }
}
