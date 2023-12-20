var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getPlaces } from './places';
import { getFloors } from './floors';
import { getStyle, getStyles } from './style';
import { getAmenities, getFeatures } from './geo';
export const getPackage = ({ initPolygons, autoLabelLines, amenityIdProperty, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, }) => __awaiter(void 0, void 0, void 0, function* () {
    const result = {};
    const promises = [
        getPlaces().then((places) => (result.places = places.data)),
        getFloors().then((floors) => (result.floors = floors.data)),
        getStyle().then((style) => (result.style = style)),
        getStyles().then((styles) => (result.styles = styles)),
        getFeatures({ initPolygons, autoLabelLines, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds }).then((features) => (result.features = features)),
        getAmenities(amenityIdProperty).then((amenities) => (result.amenities = amenities)),
    ];
    yield Promise.all(promises);
    return result;
});
export default {
    getPackage,
};
