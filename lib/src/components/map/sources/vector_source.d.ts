import BaseSource from './base_source';
export default class VectorSource extends BaseSource {
    url: string;
    tiles: string[];
    bounds: number[];
    scheme: 'xyz' | 'tms';
    constructor(id: string, data: any);
}
