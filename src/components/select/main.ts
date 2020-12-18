import Places from "../../controllers/places";
import Floors from "../../controllers/floors";
import Geo from "../../controllers/geo";
// @ts-ignore
import * as Autocomplete from "@tarekraafat/autocomplete.js/dist/js/autoComplete";
import { Subject } from 'rxjs';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import Feature from '../../models/feature';

type Datasets = 'Places' | 'Floors' | 'Pois' | undefined;

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

export class Select {
  private query = '';
  private useApiSearch = false;
  private ac;
  private onSelectListener = new Subject<PlaceModel | FloorModel | Feature | any>();

  /**
   *  @memberof Select
   *  @name constructor
   *  @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
   *  @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/?id=api-configuration for more info
   *  @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors.
   *  @example
   *  const select = new Proximiio.Select('Places');
   */
  constructor(dataset?: Datasets, options?: AutocompleteOptions, useApiSearch?: boolean) {
    const selector = options?.selector ? `${options.selector}` : '#proximiioSelect'
    this.useApiSearch = useApiSearch !== undefined ? useApiSearch : false;
    this.ac = new Autocomplete({
      data: this.getData(dataset),
      query: {
        manipulate: (query: string) => {
          this.query = query;
          return query;
        }
      },
      selector,
      onSelection: (feedback: any) => {
        (document.querySelector(selector) as HTMLInputElement).blur();
        const selection = feedback.selection.value[feedback.selection.key];
        (document.querySelector(selector) as HTMLInputElement).value = selection;
        this.onSelectListener.next(feedback.selection.value);
      },
      ...options,
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
      src: async () => {
        const places = this.useApiSearch ? await Places.getPlaces(10, 0, undefined, undefined, 'name', this.query ) : await Places.getPlaces(100);
        return places.data;
      },
      key: ['name'],
      cache: false
    };
  }

  private getFloors() {
    return {
      src: async () => {
        const floors = this.useApiSearch ? await Floors.getFloors(10, 0, undefined, undefined, 'name', this.query ) : await Floors.getFloors(100);
        return floors.data;
      },
      key: ['name'],
      cache: false
    };
  }

  private getPois() {
    return {
      src: async () => {
        return await Geo.getPois();
      },
      key: ['getTitleWithLevel'],
      cache: false
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
