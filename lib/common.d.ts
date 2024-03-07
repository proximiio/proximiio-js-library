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
export { calculateDimensions };
