import { AdModel } from '../models/ad';
export declare const getAds: () => Promise<{
    data: AdModel[];
}>;
export declare const getAdsBundle: ({ bundleUrl, }: {
    bundleUrl: string;
}) => Promise<{
    data: AdModel[];
    total: number;
}>;
declare const _default: {
    getAds: () => Promise<{
        data: AdModel[];
    }>;
    getAdsBundle: ({ bundleUrl, }: {
        bundleUrl: string;
    }) => Promise<{
        data: AdModel[];
        total: number;
    }>;
};
export default _default;
