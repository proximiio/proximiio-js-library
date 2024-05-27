export default class InteractionLogger {
    interactionType: 'mapclick' | 'search' | 'select' | 'qr';
    targetElementType?: 'amenity' | 'feature' | 'amenity_category';
    targetElementId?: string;
    targetElementTitle?: string;
    targetElementAmenity?: string;
    targetElementAmenityCategory?: string;
    searchValue?: string;
    searchSuccess?: boolean;
    foundWithFuziness?: boolean;
    fuzinessResult?: string;
    kioskId?: string;
    kioskTitle?: string;
    metadata?: Record<string, string>;
    language?: string;
    session?: string;
    constructor(data: {
        interactionType: 'mapclick' | 'search' | 'select' | 'qr';
        targetElementType?: 'amenity' | 'feature' | 'amenity_category';
        targetElementId?: string;
        targetElementTitle?: string;
        targetElementAmenity?: string;
        targetElementAmenityCategory?: string;
        searchValue?: string;
        searchSuccess?: boolean;
        foundWithFuziness?: boolean;
        fuzinessResult?: string;
        kioskId?: string;
        kioskTitle?: string;
        metadata?: Record<string, string>;
        language?: string;
        session?: string;
    });
    saveLog(): Promise<void>;
    logSelectedElement(): void;
}
