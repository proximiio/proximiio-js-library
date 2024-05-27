import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
export default class GuidanceStepsGenerator {
    points: Feature[];
    steps: GuidanceStep[];
    language: string;
    constructor(points: Feature[], language: string);
    private generateStepsFromPoints;
    private generateInstruction;
    private getBearingFromLastStep;
    private getStepDirection;
    private getDistanceFromLastStep;
    private getLevelChangerDirection;
    private getLineStringFeatureFromLastStep;
    private degreeNormalized;
}
