declare type Datasets = 'Places' | 'Floors' | 'Pois' | undefined;
interface AutocompleteOptions {
    query?: () => void;
    sort?: () => void;
    placeHolder?: string;
    selector?: string;
    observer?: boolean;
    threshold?: number;
    debounce?: number;
    searchEngine?: () => void | 'strict' | 'loose';
    resultsList?: any;
    maxResults?: number;
    highlight?: boolean;
    resultItem?: any;
    noResults?: () => void;
    onSelection?: () => void;
}
export declare class Select {
    private query;
    private useApiSearch;
    private ac;
    private onSelectListener;
    /**
     *  @memberof Select
     *  @name constructor
     *  @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
     *  @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/configuration for more info
     *  @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors.
     *  @example
     *  const select = new Proximiio.Select('Places');
     */
    constructor(dataset?: Datasets, options?: AutocompleteOptions, useApiSearch?: boolean);
    private getData;
    private getPlaces;
    private getFloors;
    private getPois;
    /**
     * Listen to on select event
     *  @memberof Select
     *  @name getSelectListener
     *  @returns returns select listener
     *  @example
     *  const select = new Proximiio.Select('Places');
     *  select.getSelectListener().subscribe((place) => {
     *    console.log('place selected', place);
     *  });
     */
    getSelectListener(): import("rxjs").Observable<any>;
}
export {};
