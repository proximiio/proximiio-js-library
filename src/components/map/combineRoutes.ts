type Geometry = {
  type: 'LineString' | 'Point';
  coordinates: number[][] | number[];
};

type Feature<T = any> = {
  type: 'Feature';
  geometry: Geometry;
  properties: T;
  id?: string;
};

type PathFeature = Feature<{
  level?: number;
  step?: number;
  source?: string;
  [key: string]: any;
}>;

type PointFeature = Feature<{
  level?: number;
  source?: string;
  [key: string]: any;
}>;

type RouteInput = {
  paths?: Record<string, PathFeature>;
  points?: PointFeature[];
  levelPaths?: Record<string, { level: number; paths: PathFeature[] }>;
  levelPoints?: Record<string, PointFeature[]>;
  details?: {
    distance?: number;
    duration?: {
      shortest?: number;
      realistic?: number;
    };
  };
};

type CombinedRoute = {
  paths: Record<string, PathFeature>;
  points: PointFeature[];
  levelPaths: Record<string, { level: number; paths: PathFeature[] }>;
  levelPoints: Record<string, PointFeature[]>;
  fullPath: Feature<{}>;
  details: {
    distance: number;
    duration: {
      shortest: number;
      realistic: number;
    };
  };
};

function combineRoutes(
  cityRoute: RouteInput,
  mallRoute: RouteInput,
  order: 'city-first' | 'mall-first' = 'city-first',
): CombinedRoute {
  const combined: CombinedRoute = {
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
  const pathMap: Record<string, string> = {};

  const mergePathSet = (pathSet: Record<string, PathFeature> = {}, source: string) => {
    for (const [key, path] of Object.entries(pathSet)) {
      const newKey = `path-part-${partIndex}`;
      const coords = path.geometry.coordinates;

      combined.paths[newKey] = {
        ...path,
        id: newKey,
        properties: {
          ...path.properties,
          step: partIndex,
          source,
        },
      };

      pathMap[key] = newKey;

      if (Array.isArray(coords[0])) {
        combined.fullPath.geometry.coordinates.push(...(coords as any));
      }

      partIndex++;
    }
  };

  const mergePoints = (points: PointFeature[] = [], source: string): PointFeature[] =>
    points.map((p) => ({
      ...p,
      properties: {
        ...(p.properties || {}),
        source,
      },
    }));

  const mergeLevelPaths = (
    levelPaths: Record<string, { level: number; paths: PathFeature[] }> = {},
    source: string,
  ) => {
    for (const [level, data] of Object.entries(levelPaths)) {
      if (!combined.levelPaths[level]) {
        combined.levelPaths[level] = { level: +level, paths: [] };
      }

      combined.levelPaths[level].paths.push(
        ...data.paths.map((p) => ({
          ...p,
          id: pathMap[p.id ?? ''] || p.id,
          properties: {
            ...p.properties,
            source,
          },
        })),
      );
    }
  };

  const buildLevelPoints = (
    cityPoints: PointFeature[] = [],
    mallLevelPoints: Record<string, PointFeature[]> = {},
  ): Record<string, PointFeature[]> => {
    const levelPoints: Record<string, PointFeature[]> = {};

    for (const point of cityPoints) {
      const level = String(point.properties?.level ?? 0);
      if (!levelPoints[level]) levelPoints[level] = [];
      levelPoints[level].push({
        ...point,
        properties: { ...(point.properties || {}), source: 'cityRoute' },
      });
    }

    for (const [level, mallPts] of Object.entries(mallLevelPoints)) {
      if (!levelPoints[level]) levelPoints[level] = [];
      levelPoints[level].push(
        ...mallPts.map((p) => ({
          ...p,
          properties: { ...(p.properties || {}), source: 'mallRoute' },
        })),
      );
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
  } else {
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

  combined.details.duration.shortest = (cityDetails.duration?.shortest || 0) + (mallDetails.duration?.shortest || 0);

  combined.details.duration.realistic = (cityDetails.duration?.realistic || 0) + (mallDetails.duration?.realistic || 0);

  return combined;
}

export default combineRoutes;
