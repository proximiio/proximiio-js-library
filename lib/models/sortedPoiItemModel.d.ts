import { Geometry } from "./feature";
import { FloorModel } from "./floor";
export interface SortedPoiItemModel {
    type: 'Feature';
    id: string;
    geometry: Geometry;
    properties: Record<string, any>;
    icon: string;
    category: string;
    search_query: string;
    coordinates: number[];
    isInside: boolean;
    score: number;
    foundInDescription: boolean;
    floor: FloorModel | undefined;
    floorName: string;
}
