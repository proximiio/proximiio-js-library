import Axios from 'axios';
import { SortedPoiItemModel } from './models/sortedPoiItemModel';
import { lineString } from '@turf/helpers';
import booleanWithin from '@turf/boolean-within';

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

const removeLeadingZero = (str: string) => {
  return str.replace(/^0+/, '');
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
  result = removeLeadingZero(result.slice(0, 10));

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
  const characters = arabicString.split('');

  // Reverse the order of the characters
  const reversedCharacters = characters.reverse();

  // Join the characters back into a string
  const reversedString = reversedCharacters.join('');

  return reversedString;
};

// Function to convert base64 to blob
const base64toBlob = (base64) => {
  const binary = atob(base64);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], { type: 'image/png' });
};

function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

const filterByAmenity = (data: any, filterCriteria?: string | string[]): any[] => {
  if (!filterCriteria) {
    return undefined;
  }
  // Convert filterCriteria to an array if it's a string
  if (typeof filterCriteria === 'string') {
    filterCriteria = [filterCriteria];
  }

  // Filter the data based on the criteria
  return data.filter((item) => {
    // Check if the amenity matches any of the filterCriteria
    const amenityMatches = filterCriteria.includes(item.properties.amenity);

    // Check if any of the included_amenities match any of the filterCriteria
    const includedAmenitiesMatch = item.properties.included_amenities?.some((amenity: string) =>
      filterCriteria.includes(amenity),
    );

    // Return true if either amenity or included_amenities match
    return amenityMatches || includedAmenitiesMatch;
  });
};

const validateLabelLine = (labelLine: string, polygon: any): boolean => {
  try {
    const coordinates = JSON.parse(labelLine);

    // 1. Validate that it's a valid JSON array of arrays
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      console.log('Input is not a valid array.');
      return false;
    }

    // Check if each sub-array contains exactly two numbers
    coordinates.forEach((coord) => {
      if (!Array.isArray(coord) || coord.length !== 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
        console.log('Each coordinate must be an array of two numbers.');
        return false;
      }

      // 2. Validate coordinate ranges
      const [lng, lat] = coord;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.log(`Invalid coordinate: [${lng}, ${lat}]`);
        return false;
      }
    });

    console.log('Coordinates are valid.');

    // 3. Create a LineString using turf.js
    const lineStringFeature = lineString(coordinates);

    console.log('LineString created successfully:', lineString);

    // Check if the LineString is inside the polygon
    const isInside = booleanWithin(lineStringFeature, polygon);

    return isInside;
  } catch (error) {
    console.error('Invalid input:', error.message);
    return false;
  }
};

export { calculateDimensions, convertToRTL, base64toBlob, throttle, filterByAmenity, validateLabelLine };
