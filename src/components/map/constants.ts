import Feature from '../../models/feature';
import { MapGeoJSONFeature } from 'maplibre-gl';

export const FONTS = [
  'Klokantech Noto Sans Bold',
  'Klokantech Noto Sans CJK Bold',
  'Klokantech Noto Sans CJK Regular',
  'Klokantech Noto Sans Italic',
  'Klokantech Noto Sans Regular',
  'Noto Sans Bold',
  'Noto Sans Bold Italic',
  'Noto Sans Italic',
  'Noto Sans Regular',
  'Open Sans Bold',
  'Open Sans Italic',
  'Open Sans Regular',
  'Open Sans Semibold',
  'Open Sans Semibold Italic',
];

export const DEFAULT_FONT = 'Klokantech Noto Sans Regular';
export const METADATA_POLYGON_EDITING = 'proximiio:polygon-editing';

export const NEW_FEATURE_DIALOG = (e: any, currentFloor: number) => {
  return `
    <h1>Add New Feature</h1>
    <form name="form" id="modal-form" class="modal-form" autocomplete="off" role="main">
      <div>
        <label class="label-id">
          <input type="text" class="text" name="id" placeholder="ID" />
          <span>ID</span>
        </label>
      </div>
      
      <div>
        <label class="label-title">
          <input type="text" class="text" name="title" placeholder="Title" required />
          <span class="required">Title</span>
        </label>
      </div>
      
      <div>
        <label class="label-level">
          <input type="number" class="text" name="level" placeholder="Level" value='${
            currentFloor ? currentFloor : 0
          }' required />
          <span class="required">Level</span>
        </label>
      </div>
  
      <div>
        <label class="label-lat">
          <input type="text" class="text" name="lat" placeholder="Latitude" value='${e.lngLat.lat}' required />
          <span class="required">Latitude</span>
        </label>
      </div>
      
      <div>
        <label class="label-lng">
          <input type="text" class="text" name="lng" placeholder="Longitude" value='${e.lngLat.lng}' required />
          <span class="required">Longitude</span>
        </label>
      </div>
      
      <div>
        <label class="label-icon">
          <input type="file" class="text" name="icon" placeholder="Icon" accept="image/*"/>
          <span>Icon</span>
        </label>
      </div>
    </form>
  `;
};

export const EDIT_FEATURE_DIALOG = (e: any, feature: MapGeoJSONFeature) => {
  return `
    <h1>Edit Feature</h1>
    <form name="form" id="modal-form" class="modal-form" autocomplete="off" role="main">
      <div>
        <label class="label-id">
          <input type="text" class="text" name="id" placeholder="ID" value='${feature?.properties?.id}' readonly style="pointer-events: none;background-color: #E9ECEF"/>
          <span>ID</span>
        </label>
      </div>
      
      <div>
        <label class="label-title">
          <input type="text" class="text" name="title" placeholder="Title" value='${feature?.properties?.title}' required />
          <span class="required">Title</span>
        </label>
      </div>
      
      <div>
        <label class="label-level">
          <input type="number" class="text" name="level" placeholder="Level" value='${feature?.properties?.level}' required />
          <span class="required">Level</span>
        </label>
      </div>
  
      <div>
        <label class="label-lat">
          <input type="text" class="text" name="lat" placeholder="Latitude" value='${e.lngLat.lat}' required />
          <span class="required">Latitude</span>
        </label>
      </div>
      
      <div>
        <label class="label-lng">
          <input type="text" class="text" name="lng" placeholder="Longitude" value='${e.lngLat.lng}' required />
          <span class="required">Longitude</span>
        </label>
      </div>
      
      <div>
        <label class="label-icon">
          <input type="file" class="text" name="icon" placeholder="Icon" accept="image/*"/>
          <span>Icon</span>
        </label>
      </div>
    </form>
  `;
};
