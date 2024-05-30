import StyleModel from '../models/style';
export declare const getStyle: (id?: string) => Promise<StyleModel>;
export declare const getStyleBundle: ({ bundleUrl }: {
    bundleUrl: string;
}) => Promise<StyleModel>;
export declare const getStyles: () => Promise<any>;
export declare const getStylesBundle: ({ bundleUrl }: {
    bundleUrl: string;
}) => Promise<any>;
export declare const getStyleUrl: () => string;
