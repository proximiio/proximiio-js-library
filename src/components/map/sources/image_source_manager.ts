import { Eventable } from '../../../eventable';
import { FloorModel } from '../../../models/floor';
import { ImageSourceRaw, RasterLayout } from 'mapbox-gl';
import { getFloors } from '../../../controllers/floors';

export default class ImageSourceManager extends Eventable {
  sources: string[] = [];
  layers: string[] = [];
  floors: {data: FloorModel[], total: number} = { data: [], total: 0};
  belowLayer = 'proximiio-floors';
  enabled = true;

  constructor() {
    super();
  }

  async initialize() {
    this.floors = await getFloors();
  }

  setLevel(map: mapboxgl.Map, level: number) {
    this.layers.forEach(id => {
      try {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      } catch (e) {
        console.log('unable to remove layer', id);
      }
    });
    this.sources.forEach(id => {
      try {
        if (map.getSource(id)) {
          map.removeSource(id);
        }
      } catch (e) {
        console.log('unable to remove source', id);
      }
    });

    if (this.enabled) {
      const floors = this.floors.data.filter(floor => floor.hasFloorplan && floor.level === level);
      floors.forEach(floor => {
        const source = {
          type: 'image',
          url: floor.floorplanImageUrl,
          // tslint:disable-next-line:no-non-null-assertion
          coordinates: floor.anchors!
        } as ImageSourceRaw;

        const sourceId = `image-source-${floor.id}`;
        map.addSource(sourceId, source);
        this.sources.push(sourceId);

        const layer = {
          id: `image-layer-${floor.id}`,
          type: 'raster' as 'raster',
          source: sourceId,
          layout: {
            visibility: 'visible'
          } as RasterLayout
        };

        map.addLayer(layer, this.belowLayer);
        this.layers.push(layer.id);
      });
    }
  }
}
