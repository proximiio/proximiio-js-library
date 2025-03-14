import { KioskModel } from '../models/kiosk';
export declare const getKiosks: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
    data: KioskModel[];
    total: number;
}>;
export declare const getKiosksBundle: ({ bundleUrl, }: {
    bundleUrl: string;
}) => Promise<{
    data: KioskModel[];
    total: number;
}>;
export declare const getKioskById: (kioskId: string) => Promise<KioskModel>;
export declare const getKioskByIdBundle: ({ bundleUrl, kioskId, }: {
    bundleUrl: string;
    kioskId: string;
}) => Promise<KioskModel>;
declare const _default: {
    getKiosks: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
        data: KioskModel[];
        total: number;
    }>;
    getKiosksBundle: ({ bundleUrl, }: {
        bundleUrl: string;
    }) => Promise<{
        data: KioskModel[];
        total: number;
    }>;
    getKioskById: (kioskId: string) => Promise<KioskModel>;
    getKioskByIdBundle: ({ bundleUrl, kioskId, }: {
        bundleUrl: string;
        kioskId: string;
    }) => Promise<KioskModel>;
};
export default _default;
