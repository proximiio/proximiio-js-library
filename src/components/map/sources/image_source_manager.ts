import { Eventable } from '../../../eventable';
import { FloorModel } from '../../../models/floor';
import { ImageSource } from 'maplibre-gl';

export default class ImageSourceManager extends Eventable {
  sources: string[] = [];
  layers: string[] = [];
  floors: FloorModel[] = [];
  belowLayer = 'proximiio-floors';
  enabled = true;

  constructor() {
    super();
  }

  async initialize({ floors }: { floors: FloorModel[] }) {
    this.floors = floors;
  }

  setLevel(map: maplibregl.Map, level: number, state: any) {
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
      const floors = this.floors.filter((floor) => floor.hasFloorplan && floor.level === level);
      floors.forEach((floor) => {
        const source = {
          type: 'image',
          url: floor.floorplanImageUrl,
          // tslint:disable-next-line:no-non-null-assertion
          coordinates: floor.anchors!,
        } as ImageSource;

        const sourceId = `image-source-${floor.id}`;
        state.style.addSource(sourceId, source);
        this.sources.push(sourceId);

        const layer = {
          id: `image-layer-${floor.id}`,
          type: 'raster' as 'raster',
          source: sourceId,
          layout: {
            visibility: 'visible',
          },
        };

        state.style.addLayer(layer, this.belowLayer);
        this.layers.push(layer.id);
      });
      map.setStyle(state.style);
    }
  }
}
