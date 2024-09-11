var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Eventable } from '../../../eventable';
export default class ImageSourceManager extends Eventable {
    constructor() {
        super();
        this.sources = [];
        this.layers = [];
        this.floors = [];
        this.belowLayer = 'proximiio-floors';
        this.enabled = true;
    }
    initialize({ floors }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.floors = floors;
        });
    }
    setLevel(map, level, state) {
        this.layers.forEach((id) => {
            try {
                if (state.style.getLayer(id)) {
                    state.style.removeLayer(id);
                }
            }
            catch (e) {
                console.log('unable to remove layer', id);
            }
        });
        this.sources.forEach((id) => {
            try {
                if (state.style.getSource(id)) {
                    state.style.removeSource(id);
                }
            }
            catch (e) {
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
                    coordinates: floor.anchors,
                };
                const sourceId = `image-source-${floor.id}`;
                state.style.addSource(sourceId, source);
                this.sources.push(sourceId);
                const layer = {
                    id: `image-layer-${floor.id}`,
                    type: 'raster',
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
