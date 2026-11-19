import { Observer } from '../eventable';
import BaseSource from '../components/map/sources/base_source';
import BaseLayer from '../components/map/layers/base_layer';
type StyleProps = {
    [property: string]: any;
};
export interface StyleLayerOverride {
    paint?: StyleProps;
    layout?: StyleProps;
}
/**
 * Persistent style changes, applied with Map.applyStyle().
 * Property value null restores the original value of that property.
 */
export interface StyleOverrides {
    layers?: {
        [layerId: string]: StyleLayerOverride;
    };
    sources?: {
        [sourceId: string]: StyleProps;
    };
}
export interface StyleResetOptions {
    layers?: string[];
    sources?: string[];
}
interface OverrideEntry {
    values: StyleProps;
    originals: StyleProps;
}
interface StoredOverrides {
    layers: {
        [layerId: string]: {
            paint: OverrideEntry;
            layout: OverrideEntry;
        };
    };
    sources: {
        [sourceId: string]: OverrideEntry;
    };
}
export default class StyleModel {
    _observers?: Observer[];
    _overrides?: StoredOverrides;
    id: string;
    organization_id: string;
    version: number;
    name: string;
    metadata: any;
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
    sources: {
        [id: string]: any;
    };
    glyphs: string;
    layers: any[];
    overlay?: boolean;
    segments: boolean;
    routable: boolean;
    cluster: boolean;
    rooms: boolean;
    constructor(data: any);
    on(observer: Observer): void;
    off(observer: Observer): void;
    notify(event?: string, data?: any): void;
    getUniversalLayers(source: string): any[];
    getSyntheticLayers(): any[];
    usesPrefixes(): boolean;
    addLayer(layer: any, beforeLayer: string): void;
    getLayer(id: string): any;
    getLayerIndex(id: string): number;
    getLayers(sourceId: string): BaseLayer[];
    addSource(sourceId: string, source: any): void;
    removeLayer(id: string): void;
    getSources(): BaseSource[];
    setSource(id: string, data: BaseSource): void;
    getSource(sourceId: string): BaseSource;
    removeSource(sourceId: string): void;
    /**
     * Stores overrides and applies them to the current layers and sources.
     * They are re-applied whenever a layer is added or a source is (re)set,
     * so they survive floor changes, route updates and style switches.
     */
    applyOverrides(overrides: StyleOverrides): void;
    /**
     * Removes overrides and restores original values.
     * Without options all overrides are removed.
     */
    resetOverrides(options?: StyleResetOptions): void;
    /** Currently stored overrides, in the same shape as accepted by applyOverrides */
    getOverrides(): StyleOverrides;
    applyLayerOverrides(layer: any): void;
    applySourceOverrides(sourceId: string): void;
    setLevel(level: number): void;
    get polygonEditing(): any;
    toggleCluster(): void;
    togglePolygonEditing(): void;
    toggleRooms(): void;
    toggleOverlay(): void;
    toggleSegments(): void;
    toggleRoutable(): void;
    togglePaths(enabled: boolean): void;
    updateLayer(layer: BaseLayer): void;
    setMetadata(namespace: string, item: string, value: any): void;
    get namespaces(): string[];
    namespaceItems(namespace: string): string[];
    get json(): any;
    hideIconLayers(): void;
    showIconLayers(): void;
    hideLayer(layerId: string): void;
    showLayer(layerId: string): void;
    setIconSize(size: (string | number | string[])[] | number | any): void;
}
export {};
