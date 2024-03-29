import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
export default class GuidanceStepsGenerator {
    points: Feature[];
    steps: GuidanceStep[];
    constructor(points: Feature[]);
    private generateStepsFromPoints;
    private getBearingFromLastStep;
    private getStepDirection;
    private getDistanceFromLastStep;
    private getLevelChangerDirection;
    private getLineStringFeatureFromLastStep;
    private degreeNormalized;
}
