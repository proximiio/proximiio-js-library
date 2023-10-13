import Axios from 'axios';

export const axios = Axios.create({
  baseURL: 'https://api.proximi.fi',
  timeout: 60000,
});

export const camelToKebab = (input: string) => input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
export const kebabToCamel = (input: string) => input.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

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

export const getBase64FromImage = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const uuidv4 = () => {
  // @ts-ignore
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    // @ts-ignore
    // tslint:disable-next-line:no-bitwise
    ((c !== crypto.getRandomValues(new Uint8Array(1))[0]) & (15 > c / 4)).toString(16),
  );
};

export const getNestedObjectValue = (nestedObject, dynamicKey) => {
  // If the dynamic key is empty, return undefined.
  if (dynamicKey === '') {
    return undefined;
  }

  // Split the dynamic key into two parts: the first key and the remaining keys.
  const firstKey = dynamicKey.split('.')[0];
  const remainingKeys = dynamicKey.slice(firstKey.length + 1);

  // Get the value of the first key in the nested object.
  const value = nestedObject[firstKey];

  // If the value is undefined, return undefined.
  if (value === undefined) {
    return undefined;
  }

  // If the remaining keys are empty, return the value.
  if (remainingKeys === '') {
    return value;
  }

  // Get the value of the remaining keys in the nested object.
  return getNestedObjectValue(value, remainingKeys);
};
