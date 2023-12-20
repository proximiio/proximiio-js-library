import BaseModel from './base';
export class FloorModel extends BaseModel {
    constructor(data) {
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
