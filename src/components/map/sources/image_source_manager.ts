import { Eventable } from '../../../eventable';
import { FloorModel } from '../../../models/floor';
import { ImageSourceRaw, RasterLayout } from 'mapbox-gl';
import { getFloors } from '../../../controllers/floors';

export default class ImageSourceManager extends Eventable {
  sources: string[] = [];
  layers: string[] = [];
  floors: { data: FloorModel[]; total: number } = { data: [], total: 0 };
  belowLayer = 'proximiio-floors';
  enabled = true;

  constructor() {
    super();
  }

  async initialize() {
    this.floors = await getFloors();
  }

  setLevel(map: mapboxgl.Map, level: number, state: any) {
    this.layers.forEach((id) => {
      try {
        if (state.style.getLayer(id)) {
          state.style.removeLayer(id);
        }
      } catch (e) {
        console.log('unable to remove layer', id);
      }
    });
    this.sources.forEach((id) => {
      try {
        if (state.style.getSource(id)) {
          state.style.removeSource(id);
        }
      } catch (e) {
        console.log('unable to remove source', id);
      }
    });

    if (this.enabled) {
      const floors = this.floors.data.filter((floor) => floor.hasFloorplan && floor.level === level);
      floors.forEach((floor) => {
        const source = {
          type: 'image',
          url: floor.floorplanImageUrl,
          // tslint:disable-next-line:no-non-null-assertion
          coordinates: floor.anchors!,
        } as ImageSourceRaw;

        const sourceId = `image-source-${floor.id}`;
        state.style.addSource(sourceId, source);
        this.sources.push(sourceId);

        const layer = {
          id: `image-layer-${floor.id}`,
          type: 'raster' as 'raster',
          source: sourceId,
          layout: {
            visibility: 'visible',
          } as RasterLayout,
        };

        state.style.addLayer(layer, this.belowLayer);
        this.layers.push(layer.id);
      });
      map.setStyle(state.style);
    }
  }
}
