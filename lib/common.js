import Axios from 'axios';
import { lineString } from '@turf/helpers';
import booleanWithin from '@turf/boolean-within';
export const axios = Axios.create({
    baseURL: 'https://api.proximi.fi',
});
export const camelToKebab = (input) => input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
export const kebabToCamel = (input) => input.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
export const kebabize = (data) => {
    const result = {};
    Object.keys(data).forEach((key) => {
        if (typeof data[key] !== 'undefined') {
            result[camelToKebab(key)] = data[key];
        }
    });
    return result;
};
export const getImageFromBase64 = (encoded) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = encoded;
        img.onload = () => resolve(img);
        img.onerror = (e) => resolve(img);
    });
};
export const getBase64FromImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};
export const uuidv4 = () => {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => 
    // @ts-ignore
    // tslint:disable-next-line:no-bitwise
    ((c !== crypto.getRandomValues(new Uint8Array(1))[0]) & (15 > c / 4)).toString(16));
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
const removeLeadingZero = (str) => {
    return str.replace(/^0+/, '');
};
// Function to remove non-numeric characters
export const removeNonNumeric = (uuid) => {
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
        }
        else {
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
export const InjectCSS = ({ id, css }) => {
    // Create the css
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = css;
    const head = document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.lastChild);
};
// Function to calculate boundingPoly dimensions
const calculateDimensions = (vertices) => {
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
function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return func(...args);
    };
}
const filterByAmenity = (data, filterCriteria) => {
    if (!filterCriteria) {
        return undefined;
    }
    // Convert filterCriteria to an array if it's a string
    if (typeof filterCriteria === 'string') {
        filterCriteria = [filterCriteria];
    }
    // Filter the data based on the criteria
    return data.filter((item) => {
        var _a;
        // Check if the amenity matches any of the filterCriteria
        const amenityMatches = filterCriteria.includes(item.properties.amenity);
        // Check if any of the included_amenities match any of the filterCriteria
        const includedAmenitiesMatch = (_a = item.properties.included_amenities) === null || _a === void 0 ? void 0 : _a.some((amenity) => filterCriteria.includes(amenity));
        // Return true if either amenity or included_amenities match
        return amenityMatches || includedAmenitiesMatch;
    });
};
const validateLabelLine = (labelLine, polygon, feature) => {
    try {
        const coordinates = typeof labelLine === 'string' ? JSON.parse(labelLine) : labelLine;
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
        // 3. Create a LineString using turf.js
        const lineStringFeature = lineString(coordinates);
        // Check if the LineString is inside the polygon
        const isInside = booleanWithin(lineStringFeature, polygon);
        return isInside;
    }
    catch (error) {
        console.log('Invalid input:', error.message);
        console.log('for feature:', feature);
        console.log('for polygon:', polygon);
        return false;
    }
};
const optimizeFeature = (feature) => {
    var _a;
    // Keep only the necessary properties
    const optimizedProperties = {
        range: feature.properties.range,
        anchor_logo: ((_a = feature.properties.metadata) === null || _a === void 0 ? void 0 : _a['anchor-logo']) || null,
        usecase: feature.properties.usecase,
        type: feature.properties.type,
        amenity: feature.properties.amenity,
        title: feature.properties.title,
        level: feature.properties.level,
        id: feature.properties.id,
        minzoom: feature.properties.minzoom,
        title_i18n: feature.properties.title_i18n,
        icon_only: feature.properties.icon_only,
        text_only: feature.properties.text_only,
        included_amenities: feature.properties.included_amenities,
        remote_id: feature.properties.remote_id,
        available: feature.properties.available,
        place_id: feature.properties.place_id,
        hideIcon: feature.properties.hideIcon,
        _dynamic: feature.properties._dynamic,
    };
    // Function to recursively shorten coordinates (handling nested arrays)
    function shortenCoordinates(coords) {
        if (Array.isArray(coords)) {
            return coords.map((c) => (Array.isArray(c) ? shortenCoordinates(c) : Number(c.toFixed(6))));
        }
        return Number(coords.toFixed(6));
    }
    // Optimize geometry by shortening coordinate precision
    const optimizedGeometry = {
        type: feature.geometry.type,
        coordinates: shortenCoordinates(feature.geometry.coordinates),
    };
    // Return a new optimized feature object
    return {
        id: feature.id,
        type: feature.type,
        geometry: optimizedGeometry,
        properties: optimizedProperties,
    };
};
const optimizeFeatures = (features) => {
    return features.map(optimizeFeature);
};
export { calculateDimensions, convertToRTL, base64toBlob, throttle, filterByAmenity, validateLabelLine, optimizeFeatures, };
