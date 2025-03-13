import { axios } from '../common';
import { FloorModel } from '../models/floor';

export const getFloors = async (
  limit?: number,
  skip?: number,
  order?: string,
  dir?: string,
  filterByIndex?: string,
  q?: string,
): Promise<{ data: FloorModel[]; total: number }> => {
  let queryParams = ``;
  if (limit) {
    queryParams += `?limit=${limit}`;
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
  try {
    const res = await axios.get(`core/floors${queryParams}`);
    return {
      data: res.data.map((item: any) => new FloorModel(item)) as FloorModel[],
      total: +res.headers.searchcount,
    };
  } catch (e) {
    throw new Error(`Retrieving floors failed, ${e.message}`);
  }
};

export const getFloorsBundle = async ({
  bundleUrl,
}: {
  bundleUrl: string;
}): Promise<{ data: FloorModel[]; total: number }> => {
  try {
    const res = await fetch(`${bundleUrl}/floors.json`);
    const data = await res.json();
    return {
      data: data.map((item: any) => new FloorModel(item)) as FloorModel[],
      total: +data.length,
    };
  } catch (e) {
    throw new Error(`Retrieving floors failed, ${e.message}`);
  }
};

export const getPlaceFloors = async (placeId: string): Promise<FloorModel[]> => {
  try {
    const res = await axios.get(`core/floors?skip=0&limit=1000&filter=place_id:${placeId}`);
    return res.data.map((item: any) => new FloorModel(item)) as FloorModel[];
  } catch (e) {
    throw new Error(`Retrieving floors for place '${placeId}' failed, ${e.message}`);
  }
};

export const getPlaceFloorsBundle = async ({
  bundleUrl,
  placeId,
}: {
  bundleUrl: string;
  placeId: string;
}): Promise<FloorModel[]> => {
  try {
    const res = await fetch(`${bundleUrl}/floors.json`);
    const data = await res.json();
    return data
      .filter((item: any) => item.place_id === placeId)
      .map((item: any) => new FloorModel(item)) as FloorModel[];
  } catch (e) {
    throw new Error(`Retrieving floors for place '${placeId}' failed, ${e.message}`);
  }
};

export const getFloorById = async (floorId: string): Promise<FloorModel> => {
  try {
    const res = await axios.get(`core/floors/${floorId}`);
    return new FloorModel(res.data) as FloorModel;
  } catch (e) {
    throw new Error(`Retrieving floor by id '${floorId}' failed, ${e.message}`);
  }
};

export const getFloorByIdBundle = async ({
  bundleUrl,
  floorId,
}: {
  bundleUrl: string;
  floorId: string;
}): Promise<FloorModel> => {
  try {
    const res = await fetch(`${bundleUrl}/floors.json`);
    const data = await res.json();
    return data.find((item: any) => item.id === floorId);
  } catch (e) {
    throw new Error(`Retrieving floor failed, ${e.message}`);
  }
};

export default {
  getFloors,
  getFloorsBundle,
  getPlaceFloors,
  getFloorById,
  getFloorByIdBundle,
};
