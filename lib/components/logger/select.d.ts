export default class SelectLogger {
    clickedElementId: string;
    clickedElementTitle: string;
    clickedElementType: 'amenity' | 'feature' | 'amenity_category';
    clickedElementAmenity?: string;
    clickedElementAmenityCategory?: string;
    source: 'manual' | 'urlParam' | 'qr';
    kioskId?: string;
    metadata?: Record<string, string>;
    language?: string;
    session?: string;
    constructor(data: {
        clickedElementId: string;
        clickedElementTitle: string;
        clickedElementType: 'amenity' | 'feature' | 'amenity_category';
        clickedElementAmenity?: string;
        clickedElementAmenityCategory?: string;
        source: 'manual' | 'urlParam' | 'qr';
        kioskId?: string;
        metadata?: Record<string, string>;
        language?: string;
        session?: string;
    });
    saveLog(): Promise<void>;
    logSelectedElement(): void;
}
