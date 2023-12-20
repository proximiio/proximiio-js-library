var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Places from '../../controllers/places';
import Floors from '../../controllers/floors';
import Geo from '../../controllers/geo';
// @ts-ignore
import * as Autocomplete from '@tarekraafat/autocomplete.js';
import { Subject } from 'rxjs';
export class Select {
    /**
     *  @memberof Select
     *  @name constructor
     *  @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
     *  @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/configuration for more info
     *  @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors, default false.
     *  @example
     *  const select = new Proximiio.Select('Places');
     */
    constructor(dataset, options, useApiSearch) {
        this.useApiSearch = false;
        this.onSelectListener = new Subject();
        const selector = (options === null || options === void 0 ? void 0 : options.selector) ? `${options.selector}` : '#proximiioSelect';
        this.useApiSearch = useApiSearch !== undefined ? useApiSearch : false;
        this.ac = new Autocomplete(Object.assign({ data: this.getData(dataset), selector }, options));
        document.querySelector(selector).addEventListener('selection', (event) => {
            const feedback = event.detail;
            document.querySelector(selector).blur();
            const selection = feedback.selection.value[feedback.selection.key];
            document.querySelector(selector).value = selection;
            this.onSelectListener.next(feedback.selection.value);
        });
    }
    getData(dataset) {
        if (dataset === 'Places') {
            return this.getPlaces();
        }
        if (dataset === 'Floors') {
            return this.getFloors();
        }
        if (dataset === 'Pois') {
            return this.getPois();
        }
    }
    getPlaces() {
        return {
            src: (query) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const places = this.useApiSearch
                        ? yield Places.getPlaces(10, 0, undefined, undefined, 'name', query)
                        : yield Places.getPlaces(100);
                    return places.data;
                }
                catch (error) {
                    return error;
                }
            }),
            keys: ['name'],
            cache: false,
        };
    }
    getFloors() {
        return {
            src: (query) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const floors = this.useApiSearch
                        ? yield Floors.getFloors(10, 0, undefined, undefined, 'name', query)
                        : yield Floors.getFloors(100);
                    return floors.data;
                }
                catch (error) {
                    return error;
                }
            }),
            keys: ['name'],
            cache: false,
        };
    }
    getPois() {
        return {
            src: (query) => __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield Geo.getPois();
                }
                catch (error) {
                    return error;
                }
            }),
            keys: ['getTitleWithLevel'],
            cache: false,
        };
    }
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
    getSelectListener() {
        return this.onSelectListener.asObservable();
    }
}
