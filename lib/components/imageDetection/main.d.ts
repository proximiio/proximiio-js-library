import { SortedPoiItemModel } from '../../models/sortedPoiItemModel';
interface Options {
    gVisionApiKey: string;
    pois: SortedPoiItemModel[];
    captureButtonText?: string;
    closeButtonText?: string;
    noResultsText?: string;
    resultsHeadingText?: string;
    returnResults?: number;
}
declare class ImageDetection {
    static init(options: Options, onSelect: (item: SortedPoiItemModel) => void): void;
}
export { ImageDetection };
