import { axios } from '../common';
import { KioskModel } from '../models/kiosk';

export const getKiosks = async (
  limit?: number,
  skip?: number,
  order?: string,
  dir?: string,
  filterByIndex?: string,
  q?: string,
  filter?: string,
): Promise<{ data: KioskModel[]; total: number }> => {
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
    const res = await axios.get(`core/kiosks${queryParams}`);
    return {
      data: res.data.map((item: any) => new KioskModel(item)) as KioskModel[],
      total: +res.headers.searchcount,
    };
  } catch (e) {
    throw new Error(`Retrieving kiosks failed, ${e.message}`);
  }
};

export const getKioskById = async (kioskId: string): Promise<KioskModel> => {
  try {
    const res = await axios.get(`core/kiosks/${kioskId}`);
    return new KioskModel(res.data) as KioskModel;
  } catch (e) {
    throw new Error(`Retrieving kiosk by id '${kioskId}' failed, ${e.message}`);
  }
};

export default {
  getKiosks,
  getKioskById,
};
