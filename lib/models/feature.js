import BaseModel from './base';
import { POI_TYPE } from './poi_type';
export class Geometry {
    constructor(data) {
        this.type = data.type;
        this.coordinates = data.coordinates;
    }
}
export class FeatureCollection {
    constructor(data) {
        this.type = 'FeatureCollection';
        this.features = (data.features || []).map((f) => new Feature(f).json);
    }
    get json() {
        return {
            type: 'FeatureCollection',
            features: this.features.map((feature) => feature.json),
        };
    }
}
export default class Feature extends BaseModel {
    constructor(data) {
        super(data);
        this.type = 'Feature';
        this.id = data.id;
        this.geometry = new Geometry(data.geometry);
        this.properties = data.properties || {};
        if (typeof this.properties.title_i18n === 'string') {
            this.properties.title_i18n = JSON.parse(this.properties.title_i18n);
        }
        if (this.isPoint) {
            if (!this.properties.images) {
                this.properties.images = [];
            }
            if (!this.properties.range) {
                this.properties.range = 3;
            }
        }
        if (typeof this.properties.images === 'string') {
            this.properties.images = JSON.parse(this.properties.images);
        }
        if (this.isLevelChanger && Array.isArray(this.properties.levels)) {
            this.properties.levels.forEach((level) => (this.properties[`__level_${level}`] = true));
        }
        if (this.properties.type === 'text' && Array.isArray(this.properties.textFont)) {
            this.properties.textFont = this.properties.textFont[0];
        }
    }
    get isEditable() {
        return this.isPoint || this.isLineString || this.isPolygon;
    }
    get isPoint() {
        return this.geometry.type === 'Point';
    }
    get isPolygon() {
        return this.geometry.type === 'Polygon' || this.geometry.type === 'MultiPolygon';
    }
    get isLineString() {
        return this.geometry.type === 'LineString' || this.geometry.type === 'MultiLineString';
    }
    get isHazard() {
        return this.properties.type === POI_TYPE.HAZARD;
    }
    get isLandmark() {
        return this.properties.type === POI_TYPE.LANDMARK;
    }
    get isDoor() {
        return this.properties.type === POI_TYPE.DOOR;
    }
    get isEntrance() {
        return this.properties.type === POI_TYPE.ENTRANCE;
    }
    get isDecisionPoint() {
        return this.properties.type === POI_TYPE.DECISION;
    }
    get isTicketGate() {
        return this.properties.type === POI_TYPE.TICKET_GATE;
    }
    get isElevator() {
        return this.properties.type === POI_TYPE.ELEVATOR;
    }
    get isEscalator() {
        return this.properties.type === POI_TYPE.ESCALATOR;
    }
    get isStairCase() {
        return this.properties.type === POI_TYPE.STAIRCASE;
    }
    get isRamp() {
        return this.properties.type === POI_TYPE.RAMP;
    }
    get isLevelChanger() {
        return this.isElevator || this.isEscalator || this.isStairCase || this.isRamp;
    }
    get isText() {
        return this.properties.type === 'text';
    }
    get isSynthetic() {
        const keys = ['id', 'place_id', 'floor_id', 'level'];
        if (this.geometry.type === 'LineString' || this.geometry.type === 'MultiLineString') {
            keys.push('class');
        }
        return (Object.keys(this.properties)
            .map((key) => !keys.includes(key))
            .filter((i) => i).length === 0);
    }
    get isRoom() {
        return this.properties.room;
    }
    get isRouting() {
        return this.properties.usecase === 'routing';
    }
    get getTitle() {
        return this.properties.title;
    }
    get getTitleWithLevel() {
        return `${this.properties.title} - Level: ${this.properties.level}`;
    }
    get json() {
        if (this.properties.cameFrom) {
            delete this.properties.cameFrom;
        }
        if (this.properties.fixedPointMap) {
            delete this.properties.fixedPointMap;
        }
        const clone = JSON.parse(JSON.stringify(this));
        if (clone.properties.metadata && typeof clone.properties.metadata !== 'object') {
            try {
                clone.properties.metadata = JSON.parse(clone.properties.metadata);
            }
            catch (e) {
                console.log('feature parsing failed:', clone.properties.metadata);
            }
        }
        Object.keys(clone.properties).forEach((key) => {
            if (key.match('__level')) {
                delete clone.properties.key;
            }
        });
        return clone;
    }
    static point(id, latitude, longitude, properties) {
        return new Feature({
            id,
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
            properties,
        });
    }
    setTitle(title, lang = 'en') {
        if (typeof this.properties.title_18n === 'undefined') {
            this.properties.title_18n = {};
        }
        this.properties.title_18n[lang] = title;
    }
    hasLevel(level) {
        if (this.isLevelChanger) {
            return this.properties.levels.includes(level);
        }
        else {
            return this.properties.level === level;
        }
    }
}
