import BaseSource from './base_source';
import { FeatureCollection } from '../../../models/feature';
export default class DataSource extends BaseSource {
    data: FeatureCollection;
    cluster: boolean;
    clusterRadius: number;
    clusterMaxZoom: number;
    isEditable: boolean;
    constructor(id: string, data?: FeatureCollection);
    get source(): {
        type: import("./base_source").BaseSourceType;
        data: FeatureCollection;
        cluster: boolean;
        clusterMaxZoom: number;
        clusterRadius: number;
    };
}
