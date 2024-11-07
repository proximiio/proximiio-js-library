import { axios } from '../../common';
import BaseLogger from './base';

export default class WayfindingLogger extends BaseLogger {
  startLngLat: [number, number];
  startLevel: number;
  startSegmentId?: string;
  startSegmentName?: string;
  startGeofenceId?: string;
  startGeofenceName?: string;
  destinationFeatureId?: string;
  destinationName?: string;
  destinationLngLat: [number, number];
  destinationLevel: number;
  foundPath: boolean;
  optionAvoidBarrier: boolean;
  optionAvoidElevators: boolean;
  optionAvoidEscalators: boolean;
  optionAvoidNarrowPaths: boolean;
  optionAvoidRamps: boolean;
  optionAvoidStaircases: boolean;
  optionAvoidTicketGates: boolean;
  route: [number, number, number][];
  rerouted?: boolean;
  navigationType?: 'mall' | 'city';

  constructor(data: any) {
    super(data);
    this.startLngLat = data.startLngLat;
    this.startLevel = data.startLevel;
    this.startSegmentId = data.startSegmentId;
    this.startSegmentName = data.startSegmentName;
    this.startGeofenceId = data.startGeofenceId;
    this.startGeofenceName = data.startGeofenceName;
    this.destinationFeatureId = data.destinationFeatureId;
    this.destinationName = data.destinationName;
    this.destinationLngLat = data.destinationLngLat;
    this.destinationLevel = data.destinationLevel;
    this.foundPath = data.foundPath;
    this.optionAvoidBarrier = data.optionAvoidBarrier;
    this.optionAvoidElevators = data.optionAvoidElevators;
    this.optionAvoidEscalators = data.optionAvoidEscalators;
    this.optionAvoidNarrowPaths = data.optionAvoidNarrowPaths;
    this.optionAvoidRamps = data.optionAvoidRamps;
    this.optionAvoidStaircases = data.optionAvoidStaircases;
    this.optionAvoidTicketGates = data.optionAvoidTicketGates;
    this.route = data.route;
    this.rerouted = data.rerouted;
    this.navigationType = data.navigationType;
  }

  async save() {
    try {
      await axios.post(`v6/geo/wayfinding_logs`, [this]);
    } catch (e) {
      console.log(`Log saving failed, ${e.message}`);
    }
  }
}
