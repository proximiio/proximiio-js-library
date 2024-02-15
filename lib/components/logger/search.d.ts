export default class SearchLogger {
    searchValue: string;
    success: boolean;
    resultId?: string;
    resultTitle?: string;
    kioskId?: string;
    metadata?: Record<string, string>;
    language?: string;
    session?: string;
    constructor(data: {
        searchValue: string;
        success: boolean;
        resultId?: string;
        resultTitle?: string;
        kioskId?: string;
        metadata?: Record<string, string>;
        language?: string;
        session?: string;
    });
    saveLog(): Promise<void>;
    logSearch(): void;
}
