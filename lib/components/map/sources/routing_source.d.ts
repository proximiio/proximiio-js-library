import DataSource from './data_source';
import Feature from '../../../models/feature';
import Routing from '../routing';
interface ChangeContainer {
    action: string;
    feature: Feature;
}
export default class RoutingSource extends DataSource {
    isEditable: boolean;
    start?: Feature;
    finish?: Feature;
    lines?: Feature[];
    changes: ChangeContainer[];
    route: any;
    points: any;
    levelPaths: any;
    levelPoints: any;
    routing: Routing;
    constructor();
    toggleAccessible(value: any): void;
    update(start?: Feature, finish?: Feature): Promise<void>;
    cancel(): void;
}
export {};
