import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
export default class GuidanceStepsGenerator {
    points: Feature[];
    steps: GuidanceStep[];
    language: string;
    landMarkNav: boolean;
    pois?: Feature[];
    levelChangers?: Feature[];
    initialBearing: number;
    constructor({ points, language, landMarkNav, pois, levelChangers, initialBearing, }: {
        points: Feature[];
        language: string;
        landMarkNav: boolean;
        pois?: Feature[];
        levelChangers?: Feature[];
        initialBearing: number;
    });
    private capitalize;
    private generateStepsFromPoints;
    private generateInstruction;
    private getDirectionInstruction;
    private getBearingFromLastStep;
    private getStepDirection;
    private getDirectionFromBearing;
    private getDistanceFromLastStep;
    private getLevelChangerDirection;
    private getLineStringFeatureFromLastStep;
    private degreeNormalized;
}
