import FillExtrusionLayer from './layers/fill_extrusion_layer';
import LineLayer from './layers/line_layer';
import SymbolLayer from './layers/symbol_layer';
import { PolygonLayer } from './main';
export declare class PolygonsLayer extends FillExtrusionLayer {
    constructor(data: PolygonLayer);
}
export declare class PolygonIconsLayer extends SymbolLayer {
    constructor(data: PolygonLayer);
}
export declare class PolygonTitlesLayer extends SymbolLayer {
    constructor(data: PolygonLayer);
}
export declare class PolygonTitlesLineLayer extends LineLayer {
    constructor(data: PolygonLayer);
}
