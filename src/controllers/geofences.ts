import { axios } from '../common';
import { GeofenceModel } from '../models/geofence';

export const getGeofences = async (
  limit?: number,
  skip?: number,
  order?: string,
  dir?: string,
  filterByIndex?: string,
  q?: string,
  filter?: string,
): Promise<{ data: GeofenceModel[]; total: number }> => {
  let queryParams = ``;
  if (limit) {
    queryParams += `?limit=${limit ? limit : 1000}`;
  }
  if (skip) {
    queryParams += `&skip=${skip}`;
  }
  if (order) {
    queryParams += `&order=${order}`;
  }
  if (dir) {
    queryParams += `&dir=${dir}`;
  }
  if (filterByIndex) {
    queryParams += `&filterByIndex=${filterByIndex}`;
  }
  if (q) {
    queryParams += `&q=${q}`;
  }
  if (filter) {
    queryParams += `&filter=${q}`;
  }
  try {
    const res = await axios.get(`core/geofences${queryParams}`);
    return {
      data: res.data.map((item: any) => new GeofenceModel(item)) as GeofenceModel[],
      total: +res.headers.searchcount,
    };
  } catch (e) {
    throw new Error(`Retrieving geofences failed, ${e.message}`);
  }
};

export const getGeofencesBundle = async ({
  bundleUrl,
}: {
  bundleUrl: string;
}): Promise<{ data: GeofenceModel[]; total: number }> => {
  try {
    const res = await fetch(`${bundleUrl}/geofences.json`);
    const data = await res.json();
    return {
      data: data.map((item: any) => new GeofenceModel(item)) as GeofenceModel[],
      total: +data.length,
    };
  } catch (e) {
    throw new Error(`Retrieving geofences failed, ${e.message}`);
  }
};

export const getGeofenceById = async (geofenceId: string): Promise<GeofenceModel> => {
  try {
    const res = await axios.get(`core/geofences/${geofenceId}`);
    return new GeofenceModel(res.data) as GeofenceModel;
  } catch (e) {
    throw new Error(`Retrieving geofence by id '${geofenceId}' failed, ${e.message}`);
  }
};

export const getGeofenceByIdBundle = async ({
  bundleUrl,
  geofenceId,
}: {
  bundleUrl: string;
  geofenceId: string;
}): Promise<GeofenceModel> => {
  try {
    const res = await fetch(`${bundleUrl}/geofences.json`);
    const data = await res.json();
    return data.find(
      (item: any) =>
        item.id?.toLowerCase() === geofenceId.toLowerCase() || item.name?.toLowerCase() === geofenceId.toLowerCase(),
    );
  } catch (e) {
    throw new Error(`Retrieving geofence failed, ${e.message}`);
  }
};

export default {
  getGeofences,
  getGeofencesBundle,
  getGeofenceById,
  getGeofenceByIdBundle,
};
