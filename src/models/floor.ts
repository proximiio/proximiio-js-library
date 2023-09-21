import BaseModel from './base';
import { Geopoint } from './geopoint';

export interface FloorEditorModel {
  angle: number;
  center: Geopoint;
  opacity: number;
  scale?: number;
  url?: string;
  width?: number;
  coordinates?:
    | {
        c1: Geopoint;
        c2: Geopoint;
        c3: Geopoint;
        c4: Geopoint;
      }
    | number[][];
}

export type Coordinates = [number, number];

export class FloorModel extends BaseModel {
  name: string;
  placeId: string;
  placeName?: string;
  floorplanImageUrl: string;
  level: number;
  anchors?: [Coordinates, Coordinates, Coordinates, Coordinates];
  editor?: FloorEditorModel;
  geopoint?: [number, number];
  remoteId?: string;
  metadata?: {
    [key: string]: string | undefined;
  };

  constructor(data: any) {
    super(data);
    this.name = data.name;
    this.placeId = data.place_id;
    this.placeName = data.place_name;
    this.floorplanImageUrl = data.floorplan_image_url;
    this.level = data.level || 0;
    if (data.anchors) {
      this.anchors = [
        [data.anchors[0].lng, data.anchors[0].lat],
        [data.anchors[1].lng, data.anchors[1].lat],
        [data.anchors[3].lng, data.anchors[3].lat],
        [data.anchors[2].lng, data.anchors[2].lat],
      ];
    }
    this.editor = data.editor;
    this.geopoint = data.geopoint;
    this.remoteId = data.remote_id;
    this.metadata = data.metadata;
  }

  get hasFloorplan() {
    return !!(this.floorplanImageUrl && this.floorplanImageUrl.length > 1 && this.anchors);
  }
}
