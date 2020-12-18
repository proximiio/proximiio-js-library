import BaseSource from './base_source';

export default class VectorSource extends BaseSource {
  url: string;
  tiles: string[];
  bounds: number[];
  scheme: 'xyz' | 'tms';

  constructor(id: string, data: any) {
    super(id, data);
    this.url = data.url;
    this.tiles = data.tiles;
    this.bounds = data.bounds;
    this.scheme = data.scheme || 'xyz';
  }
}
