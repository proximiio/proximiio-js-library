import BaseLayer, { Serializable } from './base_layer';
import { kebabize } from '../../../common';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.iconColor = data['icon-color'] || '#000000';
        this.iconOpacity = data['icon-opacity'] || 1;
        this.iconHaloColor = data['icon-halo-color'] || 'rgba(0, 0, 0, 0)';
        this.iconHaloWidth = data['icon-halo-width'] || 0;
        this.iconHaloBlur = data['icon-halo-blur'] || 0;
        this.iconTranslate = data['icon-translate'] || [0, 0];
        this.iconTranslateAnchor = data['icon-translate-anchor'] || 'map';
        this.textOpacity = data['text-opacity'] || 1;
        this.textColor = data['text-color'] || '#000000';
        this.textHaloColor = data['text-halo-color'] || 'rgba(0, 0, 0, 0)';
        this.textHaloWidth = data['text-halo-width'] || 0;
        this.textHaloBlur = data['text-halo-blur'] || 0;
        this.textTranslate = data['text-translate'] || [0, 0];
        this.textTranslateAnchor = data['text-translate-anchor'] || 'map';
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        this.visibility = data.visibility || 'visible';
        this.symbolPlacement = data['symbol-placement'] || 'point';
        this.symbolSpacing = data['symbol-spacing'] || 250;
        this.symbolAvoidEdges = data['symbol-avoid-edges'] || false;
        this.symbolSortKey = data['symbol-sort-key'];
        this.symbolZOrder = data['symbol-z-order'] || 'auto';
        this.iconAllowOverlap = data['icon-allow-overlap'] || false;
        this.iconIgnorePlacement = data['icon-ignore-placement'] || false;
        this.iconOptional = data['icon-optional'] || false;
        this.iconRotationAlignment = data['icon-rotation-alignment'] || 'auto';
        this.iconSize = data['icon-size'] || 1;
        this.iconTextFit = data['icon-text-fit'] || 'none';
        this.iconTextFitPadding = data['icon-text-fit-padding'] || [0, 0, 0, 0];
        this.iconImage = data['icon-image'];
        this.iconRotate = data['icon-rotate'] || 0;
        this.iconPadding = data['icon-padding'] || 2;
        this.iconKeepUpright = data['icon-keep-upright'] || false;
        this.iconOffset = data['icon-offset'] || [0, 0];
        this.iconAnchor = data['icon-anchor'] || 'center';
        this.iconPitchAlignment = data['icon-pitch-alignment'] || 'auto';
        this.textPitchAlignment = data['text-pitch-alignment'] || 'auto';
        this.textRotationAlignment = data['text-rotation-alignment'] || 'auto';
        if ((typeof data['text-font'] === 'string' && data['text-font'] === '{textFont}') ||
            (typeof data['text-font'] === 'object' && data['text-font'].property === 'textFont')) {
            this.textFont = [
                'match',
                ['string', ['get', 'textFont']],
                'Klokantech Noto Sans Bold',
                ['literal', ['Klokantech Noto Sans Bold']],
                'Klokantech Noto Sans CJK Bold',
                ['literal', ['Klokantech Noto Sans CJK Bold']],
                'Klokantech Noto Sans CJK Regular',
                ['literal', ['Klokantech Noto Sans CJK Regular']],
                'Klokantech Noto Sans Italic',
                ['literal', ['Klokantech Noto Sans Italic']],
                'Klokantech Noto Sans Regular',
                ['literal', ['Klokantech Noto Sans Regular']],
                'Noto Sans Bold',
                ['literal', ['Noto Sans Bold']],
                'Noto Sans Bold Italic',
                ['literal', ['Noto Sans Bold Italic']],
                'Noto Sans Italic',
                ['literal', ['Noto Sans Italic']],
                'Noto Sans Regular',
                ['literal', ['Noto Sans Regular']],
                'Open Sans Bold',
                ['literal', ['Open Sans Bold']],
                'Open Sans Italic',
                ['literal', ['Open Sans Italic']],
                'Open Sans Regular',
                ['literal', ['Open Sans Regular']],
                'Open Sans Semibold',
                ['literal', ['Open Sans Semibold']],
                'Open Sans Semibold Italic',
                ['literal', ['Open Sans Semibold Italic']],
                ['literal', ['Klokantech Noto Sans Bold']],
            ];
        }
        else {
            this.textFont = data['text-font'];
        }
        this.textField = data['text-field'] || '';
        this.textSize = data['text-size'] || 16;
        this.textMaxWidth = data['text-max-width'] || 10;
        this.textLineHeight = data['text-line-height'] || 1.2;
        this.textLetterSpacing = data['text-letter-spacing'] || 0;
        this.textJustify = data['text-justify'] || 'center';
        this.textRadialOffset = data['text-radial-offset'] || 0;
        this.textVariableAnchor = data['text-variable-anchor'];
        this.textAnchor = data['text-anchor'] || 'center';
        this.textMaxAngle = data['text-max-angle'] || 45;
        this.textWritingMode = data['text-writing-mode'];
        this.textRotate = data['text-rotate'] || 0;
        this.textPadding = data['text-padding'] || 2;
        this.textKeepUpright = data['text-keep-upright'] || true;
        this.textTransform = data['text-transform'] || 'none';
        this.textOffset = data['text-offset'] || [0, 0];
        this.textAllowOverlap = data['text-allow-overlap'] || false;
        this.textIgnorePlacement = data['text-ignore-placement'] || false;
        this.textOptional = data['text-optional'] || false;
    }
    get json() {
        const data = kebabize(this);
        data['symbol-z-order'] = this.symbolZOrder;
        delete data['symbol-zorder'];
        return data;
    }
}
export default class SymbolLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
