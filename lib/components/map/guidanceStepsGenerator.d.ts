import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
export default class GuidanceStepsGenerator {
    points: Feature[];
    steps: GuidanceStep[];
    language: string;
    landMarkNav: boolean;
    pois?: Feature[];
    levelChangers?: Feature[];
    constructor({ points, language, landMarkNav, pois, levelChangers, }: {
        points: Feature[];
        language: string;
        landMarkNav: boolean;
        pois?: Feature[];
        levelChangers?: Feature[];
    });
    private capitalize;
    private generateStepsFromPoints;
    private generateInstruction;
    private getDirectionInstruction;
    private getBearingFromLastStep;
    private getStepDirection;
    private getDistanceFromLastStep;
    private getLevelChangerDirection;
    private getLineStringFeatureFromLastStep;
    private degreeNormalized;
}
