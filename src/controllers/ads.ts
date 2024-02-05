import { axios } from '../common';
import { AdModel } from '../models/ad';

export const getAds = async (): Promise<{ data: AdModel[]; }> => {
  try {
    const res = await axios.get(`marketing/ads`);
    return {
      data: res.data.map((item: any) => new AdModel(item)) as AdModel[],
    };
  } catch (e) {
    throw new Error(`Retrieving kiosks failed, ${e.message}`);
  }
};

export default {
  getAds,
};
