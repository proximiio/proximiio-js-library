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

export const getStyles = async () => {
  const url = '/v5/geo/styles';
  const res = await axios.get(url);
  return res.data.map((item: any) => new StyleModel(item));
};

export const getStyleUrl = () => {
  return `https://api.proximi.fi/v5/geo/style?token=${axios.defaults.headers.common.Authorization}`;
};
