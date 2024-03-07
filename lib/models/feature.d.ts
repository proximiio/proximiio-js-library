import BaseModel from './base';
export declare class Geometry {
    type: string;
    coordinates: any[];
    constructor(data: any);
}
export declare class FeatureCollection {
    type: string;
    features: Feature[];
    constructor(data: any);
    get json(): {
        type: string;
        features: any[];
    };
}
export default class Feature extends BaseModel {
    type: 'Feature';
    id: string;
    geometry: Geometry;
    properties: any;
    score?: number;
    constructor(data: any);
    get isEditable(): boolean;
    get isPoint(): boolean;
    get isPolygon(): boolean;
    get isLineString(): boolean;
    get isHazard(): boolean;
    get isLandmark(): boolean;
    get isDoor(): boolean;
    get isEntrance(): boolean;
    get isDecisionPoint(): boolean;
    get isTicketGate(): boolean;
    get isElevator(): boolean;
    get isEscalator(): boolean;
    get isStairCase(): boolean;
    get isRamp(): boolean;
    get isLevelChanger(): boolean;
    get isText(): boolean;
    get isSynthetic(): boolean;
    get isRoom(): any;
    get isRouting(): boolean;
    get getTitle(): any;
    get getTitleWithLevel(): string;
    get json(): any;
    static point(id: string, latitude: number, longitude: number, properties?: any): Feature;
    setTitle(title: string, lang?: string): void;
    hasLevel(level: number): any;
}
