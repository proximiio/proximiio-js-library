import { axios } from '../common';
import { PlaceModel } from '../models/place';

export const getPlaces = async (
  limit?: number,
  skip?: number,
  order?: string,
  dir?: string,
  filterByIndex?: string,
  q?: string,
  filter?: string,
): Promise<{ data: PlaceModel[]; total: number }> => {
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
  if (filter) {
    queryParams += `&filter=${q}`;
  }
  try {
    const res = await axios.get(`core/places${queryParams}`);
    return {
      data: res.data.map((item: any) => new PlaceModel(item)) as PlaceModel[],
      total: +res.headers.searchcount,
    };
  } catch (e) {
    throw new Error(`Retrieving places failed, ${e.message}`);
  }
};

export const getPlacesBundle = async ({
  bundleUrl,
}: {
  bundleUrl: string;
}): Promise<{ data: PlaceModel[]; total: number }> => {
  try {
    const res = await fetch(`${bundleUrl}/places.json`);
    const data = await res.json();
    return {
      data: data.map((item: any) => new PlaceModel(item)) as PlaceModel[],
      total: +data.length,
    };
  } catch (e) {
    throw new Error(`Retrieving places failed, ${e.message}`);
  }
};

export const getPlaceById = async (placeId: string): Promise<PlaceModel> => {
  try {
    const res = await axios.get(`core/places/${placeId}`);
    return new PlaceModel(res.data) as PlaceModel;
  } catch (e) {
    throw new Error(`Retrieving place by id '${placeId}' failed, ${e.message}`);
  }
};

export const getPlaceByIdBundle = async ({
  bundleUrl,
  placeId,
}: {
  bundleUrl: string;
  placeId: string;
}): Promise<PlaceModel> => {
  try {
    const res = await fetch(`${bundleUrl}/places.json`);
    const data = await res.json();
    return data.find((item: any) => item.id === placeId);
  } catch (e) {
    throw new Error(`Retrieving places failed, ${e.message}`);
  }
};

export default {
  getPlaces,
  getPlaceById,
};
