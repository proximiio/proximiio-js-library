import FillExtrusionLayer from './layers/fill_extrusion_layer';
import LineLayer from './layers/line_layer';
import SymbolLayer from './layers/symbol_layer';
export declare class PolygonsLayer extends FillExtrusionLayer {
    constructor(data: any);
}
export declare class ParkingPolygonsLayer extends PolygonsLayer {
    constructor(data: any);
}
export declare class PolygonIconsLayer extends SymbolLayer {
    constructor(data: any);
}
export declare class PolygonTitlesLayer extends SymbolLayer {
    constructor(data: any);
}
export declare class ParkingPolygonTitlesLayer extends PolygonTitlesLayer {
    constructor(data: any);
}
export declare class PolygonTitlesLineLayer extends LineLayer {
    constructor(data: any);
}
