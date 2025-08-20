import { axios } from '../common';
import { AdModel } from '../models/ad';

export const getAds = async (): Promise<{ data: AdModel[] }> => {
  try {
    const res = await axios.get(`marketing/ads`);
    return {
      data: res.data.map((item: any) => new AdModel(item)) as AdModel[],
    };
  } catch (e) {
    throw new Error(`Retrieving ads failed, ${e.message}`);
  }
};

export const getAdsBundle = async ({
  bundleUrl,
}: {
  bundleUrl: string;
}): Promise<{ data: AdModel[]; total: number }> => {
  try {
    const res = await fetch(`${bundleUrl}/ads.json`);
    const data = await res.json();
    return {
      data: data.map((item: any) => new AdModel(item)) as AdModel[],
      total: +data.length,
    };
  } catch (e) {
    throw new Error(`Retrieving ads failed, ${e.message}`);
  }
};

export default {
  getAds,
  getAdsBundle,
};
