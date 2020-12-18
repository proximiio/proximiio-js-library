import Axios from 'axios';

export const axios = Axios.create({
  baseURL: 'https://api.proximi.fi',
  timeout: 60000
});

export const camelToKebab = (input: string) => input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
export const kebabToCamel = (input: string) => input.replace(/-([a-z])/g, g => g[1].toUpperCase());

export const kebabize = (data: any) => {
  const result: any = {};
  Object.keys(data).forEach((key: string) => {
    if (typeof data[key] !== 'undefined') {
      result[camelToKebab(key)] = data[key];
    }
  });
  return result;
};

export const getImageFromBase64 = (encoded: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = encoded;
    img.onload = () => resolve(img as HTMLImageElement);
    img.onerror = (e: any) => resolve(img as HTMLImageElement);
  });
};
