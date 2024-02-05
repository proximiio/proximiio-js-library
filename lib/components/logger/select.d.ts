export default class SelectLogger {
    clickedElementId: string;
    clickedElementTitle: string;
    clickedElementType: 'amenity' | 'feature' | 'amenity_category';
    source: 'manual' | 'urlParam' | 'qr';
    kioskId?: string;
    metadata?: Record<string, string>;
    constructor(data: {
        clickedElementId: string;
        clickedElementTitle: string;
        clickedElementType: 'amenity' | 'feature' | 'amenity_category';
        source: 'manual' | 'urlParam' | 'qr';
        kioskId?: string;
        metadata?: Record<string, string>;
    });
    saveLog(): Promise<void>;
    logSelectedElement(): void;
}
