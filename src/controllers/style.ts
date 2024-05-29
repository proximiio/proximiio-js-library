import { axios } from '../common';
import StyleModel from '../models/style';

export const getStyle = async (id?: string) => {
  let url = '/v5/geo/style';
  if (id) {
    url += `s/${id}`;
  }
  const res = await axios.get(url);
  return new StyleModel(res.data);
};

export const getStyleBundle = async ({ bundleUrl }: { bundleUrl: string }) => {
  try {
    const res = await fetch(`${bundleUrl}/style.json`);
    const data = await res.json();
    return new StyleModel(data);
  } catch (e) {
    throw new Error(`Retrieving style failed, ${e.message}`);
  }
};

export const getStyles = async () => {
  const url = '/v5/geo/styles';
  const res = await axios.get(url);
  return res.data.map((item: any) => new StyleModel(item));
};

export const getStylesBundle = async ({ bundleUrl }: { bundleUrl: string }) => {
  try {
    const res = await fetch(`${bundleUrl}/styles.json`);
    const data = await res.json();
    return data.map((item: any) => new StyleModel(item));
  } catch (e) {
    throw new Error(`Retrieving styles failed, ${e.message}`);
  }
};

export const getStyleUrl = () => {
  return `https://api.proximi.fi/v5/geo/style?token=${axios.defaults.headers.common.Authorization}`;
};
