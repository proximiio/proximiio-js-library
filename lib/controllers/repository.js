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
import { getKiosks } from './kiosks';
export const getPackage = ({ initPolygons, polygonFeatureTypes, autoLabelLines, amenityIdProperty, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = {};
        const placesPromise = getPlaces().then((places) => (result.places = places.data));
        const floorsPromise = getFloors().then((floors) => (result.floors = floors.data));
        const kiosksPromise = getKiosks().then((kiosks) => (result.kiosks = kiosks.data));
        const stylePromise = getStyle().then((style) => (result.style = style));
        const stylesPromise = getStyles().then((styles) => (result.styles = styles));
        const featuresPromise = getFeatures({
            initPolygons,
            polygonFeatureTypes,
            autoLabelLines,
            hiddenAmenities,
            useTimerangeData,
            filter,
            featuresMaxBounds,
        }).then((features) => (result.features = features));
        const amenitiesPromise = getAmenities(amenityIdProperty).then((amenities) => (result.amenities = amenities));
        yield Promise.all([
            placesPromise,
            floorsPromise,
            kiosksPromise,
            stylePromise,
            stylesPromise,
            featuresPromise,
            amenitiesPromise,
        ]);
        return result;
    }
    catch (error) {
        throw new Error(`Retrieving repository failed, ${error.message}`);
    }
});
export default {
    getPackage,
};
