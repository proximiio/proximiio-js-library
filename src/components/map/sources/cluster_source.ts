import DataSource from './data_source';
import { FeatureCollection } from '../../../models/feature';

export default class ClusterSource extends DataSource {
  cluster = true;
  data = new FeatureCollection({});

  constructor() {
    super('clusters');
  }
}
