function combineRoutes(cityRoute, mallRoute, order = 'city-first') {
    var _a, _b, _c, _d;
    const combined = {
        paths: {},
        points: [],
        levelPaths: {},
        levelPoints: {},
        fullPath: {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [],
            },
            properties: {},
        },
        details: {
            distance: 0,
            duration: {
                shortest: 0,
                realistic: 0,
            },
        },
    };
    let partIndex = 0;
    const pathMap = {};
    const mergePathSet = (pathSet = {}, source) => {
        for (const [key, path] of Object.entries(pathSet)) {
            const newKey = `path-part-${partIndex}`;
            const coords = path.geometry.coordinates;
            combined.paths[newKey] = Object.assign(Object.assign({}, path), { id: newKey, properties: Object.assign(Object.assign({}, path.properties), { step: partIndex, source }) });
            pathMap[key] = newKey;
            if (Array.isArray(coords[0])) {
                combined.fullPath.geometry.coordinates.push(...coords);
            }
            partIndex++;
        }
    };
    const mergePoints = (points = [], source) => points.map((p) => (Object.assign(Object.assign({}, p), { properties: Object.assign(Object.assign({}, (p.properties || {})), { source }) })));
    const mergeLevelPaths = (levelPaths = {}, source) => {
        for (const [level, data] of Object.entries(levelPaths)) {
            if (!combined.levelPaths[level]) {
                combined.levelPaths[level] = { level: +level, paths: [] };
            }
            combined.levelPaths[level].paths.push(...data.paths.map((p) => {
                var _a;
                return (Object.assign(Object.assign({}, p), { id: pathMap[(_a = p.id) !== null && _a !== void 0 ? _a : ''] || p.id, properties: Object.assign(Object.assign({}, p.properties), { source }) }));
            }));
        }
    };
    const buildLevelPoints = (cityPoints = [], mallLevelPoints = {}) => {
        var _a, _b;
        const levelPoints = {};
        for (const point of cityPoints) {
            const level = String((_b = (_a = point.properties) === null || _a === void 0 ? void 0 : _a.level) !== null && _b !== void 0 ? _b : 0);
            if (!levelPoints[level])
                levelPoints[level] = [];
            levelPoints[level].push(Object.assign(Object.assign({}, point), { properties: Object.assign(Object.assign({}, (point.properties || {})), { source: 'cityRoute' }) }));
        }
        for (const [level, mallPts] of Object.entries(mallLevelPoints)) {
            if (!levelPoints[level])
                levelPoints[level] = [];
            levelPoints[level].push(...mallPts.map((p) => (Object.assign(Object.assign({}, p), { properties: Object.assign(Object.assign({}, (p.properties || {})), { source: 'mallRoute' }) }))));
        }
        return levelPoints;
    };
    // Merge based on the selected order
    if (order === 'city-first') {
        mergePathSet(cityRoute.paths, 'cityRoute');
        mergePathSet(mallRoute.paths, 'mallRoute');
        combined.points = [...mergePoints(cityRoute.points, 'cityRoute'), ...mergePoints(mallRoute.points, 'mallRoute')];
        mergeLevelPaths(cityRoute.levelPaths, 'cityRoute');
        mergeLevelPaths(mallRoute.levelPaths, 'mallRoute');
        combined.levelPoints = buildLevelPoints(cityRoute.points, mallRoute.levelPoints);
    }
    else {
        mergePathSet(mallRoute.paths, 'mallRoute');
        mergePathSet(cityRoute.paths, 'cityRoute');
        combined.points = [...mergePoints(mallRoute.points, 'mallRoute'), ...mergePoints(cityRoute.points, 'cityRoute')];
        mergeLevelPaths(mallRoute.levelPaths, 'mallRoute');
        mergeLevelPaths(cityRoute.levelPaths, 'cityRoute');
        combined.levelPoints = buildLevelPoints(cityRoute.points, mallRoute.levelPoints);
    }
    // Merge details (sum up)
    const cityDetails = cityRoute.details || {};
    const mallDetails = mallRoute.details || {};
    combined.details.distance = (cityDetails.distance || 0) + (mallDetails.distance || 0);
    combined.details.duration.shortest = (((_a = cityDetails.duration) === null || _a === void 0 ? void 0 : _a.shortest) || 0) + (((_b = mallDetails.duration) === null || _b === void 0 ? void 0 : _b.shortest) || 0);
    combined.details.duration.realistic = (((_c = cityDetails.duration) === null || _c === void 0 ? void 0 : _c.realistic) || 0) + (((_d = mallDetails.duration) === null || _d === void 0 ? void 0 : _d.realistic) || 0);
    return combined;
}
export default combineRoutes;
