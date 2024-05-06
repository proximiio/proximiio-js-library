import { SortedPoiItemModel } from '../../models/sortedPoiItemModel';
interface Options {
    gVisionApiKey: string;
    pois: SortedPoiItemModel[];
    cameraText?: string;
    captureButtonText?: string;
    closeButtonText?: string;
    tryAgainButtonText?: string;
    confirmButtonText?: string;
    noResultsText?: string;
    resultsHeadingText?: string;
    returnResults?: number;
    brandColor?: string;
    dir?: string;
}
declare class ImageDetection {
    static init(options: Options, onSelect: (item: SortedPoiItemModel) => void): void;
}
export { ImageDetection };
