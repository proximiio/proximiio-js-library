export declare const axios: import("axios").AxiosInstance;
export declare const camelToKebab: (input: string) => string;
export declare const kebabToCamel: (input: string) => string;
export declare const kebabize: (data: any) => any;
export declare const getImageFromBase64: (encoded: string) => Promise<HTMLImageElement>;
export declare const getBase64FromImage: (file: File) => Promise<string>;
export declare const uuidv4: () => any;
export declare const getNestedObjectValue: (nestedObject: any, dynamicKey: any) => any;
export declare const removeNonNumeric: (uuid: string) => string;
export declare const InjectCSS: ({ id, css }: {
    id: string;
    css: string;
}) => void;
declare const calculateDimensions: (vertices: [{
    x: number;
    y: number;
}]) => {
    width: number;
    height: number;
    area: number;
};
declare const convertToRTL: (arabicString: any) => any;
declare const base64toBlob: (base64: any) => Blob;
declare function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
declare const filterByAmenity: (data: any, filterCriteria?: string | string[]) => any[];
declare const validateLabelLine: (labelLine: string, polygon: any) => boolean;
export { calculateDimensions, convertToRTL, base64toBlob, throttle, filterByAmenity, validateLabelLine };
