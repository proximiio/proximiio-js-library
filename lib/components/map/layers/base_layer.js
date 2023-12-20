// The type of layer is specified  by the "type" property, and must be one of background, fill, line, symbol,
// raster, circle, fill-extrusion, heatmap, hillshade.
// Except for layers of the background type, each layer needs to refer to a source. Layers take the data that
// they get from a source, optionally filter features, and then define how those features are styled.
import { kebabize } from '../../../common';
export class Serializable {
    get json() {
        return kebabize(this);
    }
}
export default class BaseLayer {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.source = data.source;
        this.sourceLayer = data['source-layer'];
        this.minzoom = data.minzoom;
        this.maxzoom = data.maxzoom;
        this.filter = data.filter;
        this.metadata = data.metadata;
    }
    get json() {
        const { id, type, source, sourceLayer, minzoom, maxzoom, filter, metadata } = this;
        const data = { id, type };
        if (source) {
            data.source = source;
        }
        if (sourceLayer) {
            data['source-layer'] = sourceLayer;
        }
        if (minzoom) {
            data.minzoom = minzoom;
        }
        if (maxzoom) {
            data.maxzoom = maxzoom;
        }
        if (filter) {
            data.filter = filter;
        }
        if (this.metadata) {
            data.metadata = metadata;
        }
        if (this.paint) {
            data.paint = this.paint.json;
        }
        if (this.layout) {
            data.layout = this.layout.json;
        }
        return data;
    }
    setFilterLevel(level) {
        this.filter.forEach((filter, filterIndex) => {
            if (this.id === 'proximiio-levelchangers') {
                const lvl = `__level_${level}`;
                if (filterIndex === 3) {
                    filter[1] = lvl;
                }
                if (filterIndex === 4) {
                    filter[1][1] = lvl;
                }
            }
            if (Array.isArray(filter)) {
                let changed = false;
                if (filter[0] === '==') {
                    const expression = filter[1];
                    if (expression[0] === 'to-number') {
                        if (expression[1][0] === 'get' && expression[1][1] === 'level') {
                            filter[2] = level;
                            changed = true;
                        }
                    }
                    if (expression[0] === 'get' && expression[1] === 'level') {
                        filter[2] = level;
                        changed = true;
                    }
                }
                if (filter[0] === '<=') {
                    const expression = filter[1];
                    if (expression[0] === 'to-number') {
                        if (expression[1][0] === 'get' && expression[1][1] === 'level_min') {
                            filter[2] = level;
                            changed = true;
                        }
                    }
                    if (expression[0] === 'get' && expression[1] === 'level_min') {
                        filter[2] = level;
                        changed = true;
                    }
                }
                if (filter[0] === '>=') {
                    const expression = filter[1];
                    if (expression[0] === 'to-number') {
                        if (expression[1][0] === 'get' && expression[1][1] === 'level_max') {
                            filter[2] = level;
                            changed = true;
                        }
                    }
                    if (expression[0] === 'get' && expression[1] === 'level_max') {
                        filter[2] = level;
                        changed = true;
                    }
                }
                if (changed) {
                    this.filter[filterIndex] = filter;
                }
            }
        });
    }
}
