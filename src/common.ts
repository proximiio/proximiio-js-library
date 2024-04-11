import Axios from 'axios';

export const axios = Axios.create({
  baseURL: 'https://api.proximi.fi',
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

// Function to remove non-numeric characters
export const removeNonNumeric = (uuid: string) => {
  // Remove hyphens from the UUID
  uuid = uuid.replace(/[^0-9.]/g, '');

  // Initialize the result string
  let result = '';

  // Variable to track whether we are capturing the first or last number
  let captureFirst = true;

  // Index for capturing the first number
  let firstIndex = 0;

  // Index for capturing the last number
  let lastIndex = uuid.length - 1;

  // Loop until we have enough digits or run out of digits in the UUID
  while (result.length < 10 && firstIndex <= lastIndex) {
    // If we're capturing the first number
    if (captureFirst) {
      // Add the first numerical digit to the result
      result += uuid[firstIndex];
      // Move to the next digit for the next iteration
      firstIndex++;
    } else {
      // Add the last numerical digit to the result
      result += uuid[lastIndex];
      // Move to the previous digit for the next iteration
      lastIndex--;
    }
    // Toggle between capturing first and last numbers
    captureFirst = !captureFirst;
  }

  // Truncate the result to fit within 10 bytes
  result = result.slice(0, 10);

  return result;
};

export const InjectCSS = ({ id, css }: { id: string; css: string }) => {
  // Create the css
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = css;

  const head = document.getElementsByTagName('head')[0];
  head.insertBefore(style, head.lastChild);
};

// Function to calculate boundingPoly dimensions
const calculateDimensions = (vertices: [{ x: number; y: number }]) => {
  let minX = Number.MAX_SAFE_INTEGER;
  let minY = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let maxY = Number.MIN_SAFE_INTEGER;

  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;

  return { width, height, area };
};

const convertToRTL = (arabicString) => {
  // Split the string into an array of characters
  var characters = arabicString.split('');

  // Reverse the order of the characters
  var reversedCharacters = characters.reverse();

  // Join the characters back into a string
  var reversedString = reversedCharacters.join('');

  return reversedString;
};

export { calculateDimensions, convertToRTL };
