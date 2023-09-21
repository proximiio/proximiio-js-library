import { AroundCenterOptions, CameraUpdateTransformFunction, ControlPosition, DragPanOptions, FitBoundsOptions, GestureOptions, LngLatBoundsLike, LngLatLike, RequestTransformFunction, StyleSpecification } from 'maplibre-gl';
export interface MapboxOptions {
    /**
     * If `true`, the map's position (zoom, center latitude, center longitude, bearing, and pitch) will be synced with the hash fragment of the page's URL.
     * For example, `http://path/to/my/page.html#2.59/39.26/53.07/-24.1/60`.
     * An additional string may optionally be provided to indicate a parameter-styled hash,
     * e.g. http://path/to/my/page.html#map=2.59/39.26/53.07/-24.1/60&foo=bar, where foo
     * is a custom parameter and bar is an arbitrary hash distinct from the map hash.
     * @defaultValue false
     */
    hash?: boolean | string;
    /**
     * If `false`, no mouse, touch, or keyboard listeners will be attached to the map, so it will not respond to interaction.
     * @defaultValue true
     */
    interactive?: boolean;
    /**
     * The HTML element in which MapLibre GL JS will render the map, or the element's string `id`. The specified element must have no children.
     */
    container?: HTMLElement | string;
    /**
     * The threshold, measured in degrees, that determines when the map's
     * bearing will snap to north. For example, with a `bearingSnap` of 7, if the user rotates
     * the map within 7 degrees of north, the map will automatically snap to exact north.
     * @defaultValue 7
     */
    bearingSnap?: number;
    /**
     * If `true`, an {@link AttributionControl} will be added to the map.
     * @defaultValue true
     */
    attributionControl?: boolean;
    /**
     * Attribuition text to show in an {@link AttributionControl}. Only applicable if `options.attributionControl` is `true`.
     */
    customAttribution?: string | string[];
    /**
     * If `true`, the MapLibre logo will be shown.
     * @defaultValue false
     */
    maplibreLogo?: boolean;
    /**
     * A string representing the position of the MapLibre wordmark on the map. Valid options are `top-left`,`top-right`, `bottom-left`, or `bottom-right`.
     * @defaultValue 'bottom-left'
     */
    logoPosition?: ControlPosition;
    /**
     * If `true`, map creation will fail if the performance of MapLibre GL JS would be dramatically worse than expected
     * (i.e. a software renderer would be used).
     * @defaultValue false
     */
    failIfMajorPerformanceCaveat?: boolean;
    /**
     * If `true`, the map's canvas can be exported to a PNG using `map.getCanvas().toDataURL()`. This is `false` by default as a performance optimization.
     * @defaultValue false
     */
    preserveDrawingBuffer?: boolean;
    /**
     * If `true`, the gl context will be created with MSAA antialiasing, which can be useful for antialiasing custom layers. This is `false` by default as a performance optimization.
     */
    antialias?: boolean;
    /**
     * If `false`, the map won't attempt to re-request tiles once they expire per their HTTP `cacheControl`/`expires` headers.
     * @defaultValue true
     */
    refreshExpiredTiles?: boolean;
    /**
     * If set, the map will be constrained to the given bounds.
     */
    maxBounds?: LngLatBoundsLike;
    /**
     * If `true`, the "scroll to zoom" interaction is enabled. {@link AroundCenterOptions} are passed as options to {@link ScrollZoomHandler#enable}.
     * @defaultValue true
     */
    scrollZoom?: boolean | AroundCenterOptions;
    /**
     * The minimum zoom level of the map (0-24).
     * @defaultValue 0
     */
    minZoom?: number | null;
    /**
     * The maximum zoom level of the map (0-24).
     * @defaultValue 22
     */
    maxZoom?: number | null;
    /**
     * The minimum pitch of the map (0-85). Values greater than 60 degrees are experimental and may result in rendering issues. If you encounter any, please raise an issue with details in the MapLibre project.
     * @defaultValue 0
     */
    minPitch?: number | null;
    /**
     * The maximum pitch of the map (0-85). Values greater than 60 degrees are experimental and may result in rendering issues. If you encounter any, please raise an issue with details in the MapLibre project.
     * @defaultValue 60
     */
    maxPitch?: number | null;
    /**
     * If `true`, the "box zoom" interaction is enabled (see {@link BoxZoomHandler}).
     * @defaultValue true
     */
    boxZoom?: boolean;
    /**
     * If `true`, the "drag to rotate" interaction is enabled (see {@link DragRotateHandler}).
     * @defaultValue true
     */
    dragRotate?: boolean;
    /**
     * If `true`, the "drag to pan" interaction is enabled. An `Object` value is passed as options to {@link DragPanHandler#enable}.
     * @defaultValue true
     */
    dragPan?: boolean | DragPanOptions;
    /**
     * If `true`, keyboard shortcuts are enabled (see {@link KeyboardHandler}).
     * @defaultValue true
     */
    keyboard?: boolean;
    /**
     * If `true`, the "double click to zoom" interaction is enabled (see {@link DoubleClickZoomHandler}).
     * @defaultValue true
     */
    doubleClickZoom?: boolean;
    /**
     * If `true`, the "pinch to rotate and zoom" interaction is enabled. An `Object` value is passed as options to {@link TwoFingersTouchZoomRotateHandler#enable}.
     * @defaultValue true
     */
    touchZoomRotate?: boolean | AroundCenterOptions;
    /**
     * If `true`, the "drag to pitch" interaction is enabled. An `Object` value is passed as options to {@link TwoFingersTouchPitchHandler#enable}.
     * @defaultValue true
     */
    touchPitch?: boolean | AroundCenterOptions;
    /**
     * If `true` or set to an options object, the map is only accessible on desktop while holding Command/Ctrl and only accessible on mobile with two fingers. Interacting with the map using normal gestures will trigger an informational screen. With this option enabled, "drag to pitch" requires a three-finger gesture. Cooperative gestures are disabled when a map enters fullscreen using {@link FullscreenControl}.
     * @defaultValue undefined
     */
    cooperativeGestures?: boolean | GestureOptions;
    /**
     * If `true`, the map will automatically resize when the browser window resizes.
     * @defaultValue true
     */
    trackResize?: boolean;
    /**
     * The initial geographical centerpoint of the map. If `center` is not specified in the constructor options, MapLibre GL JS will look for it in the map's style object. If it is not specified in the style, either, it will default to `[0, 0]` Note: MapLibre GL JS uses longitude, latitude coordinate order (as opposed to latitude, longitude) to match GeoJSON.
     * @defaultValue [0, 0]
     */
    center?: LngLatLike;
    /**
     * The initial zoom level of the map. If `zoom` is not specified in the constructor options, MapLibre GL JS will look for it in the map's style object. If it is not specified in the style, either, it will default to `0`.
     * @defaultValue 0
     */
    zoom?: number;
    /**
     * The initial bearing (rotation) of the map, measured in degrees counter-clockwise from north. If `bearing` is not specified in the constructor options, MapLibre GL JS will look for it in the map's style object. If it is not specified in the style, either, it will default to `0`.
     * @defaultValue 0
     */
    bearing?: number;
    /**
     * The initial pitch (tilt) of the map, measured in degrees away from the plane of the screen (0-85). If `pitch` is not specified in the constructor options, MapLibre GL JS will look for it in the map's style object. If it is not specified in the style, either, it will default to `0`. Values greater than 60 degrees are experimental and may result in rendering issues. If you encounter any, please raise an issue with details in the MapLibre project.
     * @defaultValue 0
     */
    pitch?: number;
    /**
     * If `true`, multiple copies of the world will be rendered side by side beyond -180 and 180 degrees longitude. If set to `false`:
     * - When the map is zoomed out far enough that a single representation of the world does not fill the map's entire
     * container, there will be blank space beyond 180 and -180 degrees longitude.
     * - Features that cross 180 and -180 degrees longitude will be cut in two (with one portion on the right edge of the
     * map and the other on the left edge of the map) at every zoom level.
     * @defaultValue true
     */
    renderWorldCopies?: boolean;
    /**
     * The maximum number of tiles stored in the tile cache for a given source. If omitted, the cache will be dynamically sized based on the current viewport which can be set using `maxTileCacheZoomLevels` constructor options.
     * @defaultValue null
     */
    maxTileCacheSize?: number;
    /**
     * The maximum number of zoom levels for which to store tiles for a given source. Tile cache dynamic size is calculated by multiplying `maxTileCacheZoomLevels` with the approximate number of tiles in the viewport for a given source.
     * @defaultValue 5
     */
    maxTileCacheZoomLevels?: number;
    /**
     * A callback run before the Map makes a request for an external URL. The callback can be used to modify the url, set headers, or set the credentials property for cross-origin requests.
     * Expected to return an object with a `url` property and optionally `headers` and `credentials` properties.
     */
    transformRequest?: RequestTransformFunction;
    /**
     * A callback run before the map's camera is moved due to user input or animation. The callback can be used to modify the new center, zoom, pitch and bearing.
     * Expected to return an object containing center, zoom, pitch or bearing values to overwrite.
     */
    transformCameraUpdate?: CameraUpdateTransformFunction;
    /**
     * A patch to apply to the default localization table for UI strings, e.g. control tooltips. The `locale` object maps namespaced UI string IDs to translated strings in the target language; see `src/ui/default_locale.js` for an example with all supported string IDs. The object may specify all UI strings (thereby adding support for a new translation) or only a subset of strings (thereby patching the default translation table).
     * @defaultValue null
     */
    locale?: any;
    /**
     * Controls the duration of the fade-in/fade-out animation for label collisions after initial map load, in milliseconds. This setting affects all symbol layers. This setting does not affect the duration of runtime styling transitions or raster tile cross-fading.
     * @defaultValue 300
     */
    fadeDuration?: number;
    /**
     * If `true`, symbols from multiple sources can collide with each other during collision detection. If `false`, collision detection is run separately for the symbols in each source.
     * @defaultValue true
     */
    crossSourceCollisions?: boolean;
    /**
     * If `true`, Resource Timing API information will be collected for requests made by GeoJSON and Vector Tile web workers (this information is normally inaccessible from the main Javascript thread). Information will be returned in a `resourceTiming` property of relevant `data` events.
     * @defaultValue false
     */
    collectResourceTiming?: boolean;
    /**
     * The max number of pixels a user can shift the mouse pointer during a click for it to be considered a valid click (as opposed to a mouse drag).
     * @defaultValue true
     */
    clickTolerance?: number;
    /**
     * The initial bounds of the map. If `bounds` is specified, it overrides `center` and `zoom` constructor options.
     */
    bounds?: LngLatBoundsLike;
    /**
     * A {@link FitBoundsOptions} options object to use _only_ when fitting the initial `bounds` provided above.
     */
    fitBoundsOptions?: FitBoundsOptions;
    /**
     *  Defines a CSS
     * font-family for locally overriding generation of glyphs in the 'CJK Unified Ideographs', 'Hiragana', 'Katakana' and 'Hangul Syllables' ranges.
     * In these ranges, font settings from the map's style will be ignored, except for font-weight keywords (light/regular/medium/bold).
     * Set to `false`, to enable font settings from the map's style for these glyph ranges.
     * The purpose of this option is to avoid bandwidth-intensive glyph server requests. (See [Use locally generated ideographs](https://maplibre.org/maplibre-gl-js/docs/examples/local-ideographs).)
     * @defaultValue 'sans-serif'
     */
    localIdeographFontFamily?: string;
    /**
     * The map's MapLibre style. This must be a JSON object conforming to
     * the schema described in the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/),
     * or a URL to such JSON.
     */
    style?: StyleSpecification | string;
    /**
     * If `false`, the map's pitch (tilt) control with "drag to rotate" interaction will be disabled.
     * @defaultValue true
     */
    pitchWithRotate?: boolean;
    /**
     * The pixel ratio. The canvas' `width` attribute will be `container.clientWidth * pixelRatio` and its `height` attribute will be `container.clientHeight * pixelRatio`. Defaults to `devicePixelRatio` if not specified.
     */
    pixelRatio?: number;
    /**
     * If false, style validation will be skipped. Useful in production environment.
     * @defaultValue true
     */
    validateStyle?: boolean;
    /**
     * The canvas' `width` and `height` max size. The values are passed as an array where the first element is max width and the second element is max height.
     * You shouldn't set this above WebGl `MAX_TEXTURE_SIZE`. Defaults to [4096, 4096].
     */
    maxCanvasSize?: [number, number];
}
