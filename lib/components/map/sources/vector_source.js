import BaseSource from './base_source';
export default class VectorSource extends BaseSource {
    constructor(id, data) {
        super(id, data);
        this.url = data.url;
        this.tiles = data.tiles;
        this.bounds = data.bounds;
        this.scheme = data.scheme || 'xyz';
    }
}
