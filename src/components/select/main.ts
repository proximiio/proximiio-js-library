import Places from '../../controllers/places';
import Floors from '../../controllers/floors';
import Geo from '../../controllers/geo';
// @ts-ignore
import * as Autocomplete from '@tarekraafat/autocomplete.js';
import { Subject } from 'rxjs';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import Feature from '../../models/feature';

type Datasets = 'Places' | 'Floors' | 'Pois' | undefined;

interface AutocompleteOptions {
  name?: string;
  selector?: () => void | string;
  wrapper: boolean;
  trigger?: () => void;
  query?: () => void;
  placeHolder?: string;
  threshold?: number;
  debounce?: number;
  searchEngine?: () => void | 'strict' | 'loose';
  diacritics: boolean;
  resultsList?: {
    tag?: string;
    id?: string;
    class?: string;
    destination?: () => void | string;
    position?: string;
    element?: () => void;
    maxResults?: number;
    tabSelect?: boolean;
    noResults?: boolean;
  };
  resultItem?: {
    tag?: string;
    id?: string;
    class?: string;
    element?: () => void;
    highlight?: boolean | string;
    selected?: string;
  };
  submit?: boolean;
  events?: any;
}

export class Select {
  private useApiSearch = false;
  private ac;
  private onSelectListener = new Subject<PlaceModel | FloorModel | Feature | any>();

  /**
   *  @memberof Select
   *  @name constructor
   *  @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
   *  @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/configuration for more info
   *  @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors, default false.
   *  @example
   *  const select = new Proximiio.Select('Places');
   */
  constructor(dataset?: Datasets, options?: AutocompleteOptions, useApiSearch?: boolean) {
    const selector = options?.selector ? `${options.selector}` : '#proximiioSelect';
    this.useApiSearch = useApiSearch !== undefined ? useApiSearch : false;
    this.ac = new Autocomplete({
      data: this.getData(dataset),
      selector,
      ...options,
    });

    (document.querySelector(selector) as HTMLInputElement).addEventListener('selection', (event: any) => {
      const feedback = event.detail;
      (document.querySelector(selector) as HTMLInputElement).blur();
      const selection = feedback.selection.value[feedback.selection.key];
      (document.querySelector(selector) as HTMLInputElement).value = selection;
      this.onSelectListener.next(feedback.selection.value);
    });
  }

  private getData(dataset: Datasets) {
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

  private getPlaces() {
    return {
      src: async (query: string) => {
        try {
          const places = this.useApiSearch
            ? await Places.getPlaces(10, 0, undefined, undefined, 'name', query)
            : await Places.getPlaces(100);
          return places.data;
        } catch (error) {
          return error;
        }
      },
      keys: ['name'],
      cache: false,
    };
  }

  private getFloors() {
    return {
      src: async (query: string) => {
        try {
          const floors = this.useApiSearch
            ? await Floors.getFloors(10, 0, undefined, undefined, 'name', query)
            : await Floors.getFloors(100);
          return floors.data;
        } catch (error) {
          return error;
        }
      },
      keys: ['name'],
      cache: false,
    };
  }

  private getPois() {
    return {
      src: async (query: string) => {
        try {
          return await Geo.getPois();
        } catch (error) {
          return error;
        }
      },
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
  public getSelectListener() {
    return this.onSelectListener.asObservable();
  }
}
