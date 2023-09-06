import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
export default class GuidanceTextGenerator {
    points: Feature[];
    steps: GuidanceStep[];
    constructor(points: Feature[]);
    generateStepsFromPoints(): void;
}
