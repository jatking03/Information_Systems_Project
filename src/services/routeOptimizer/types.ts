
import { LatLng, ChargingStation } from '@/lib/mapUtils';

export interface RouteNode {
  location: LatLng;
  parent: RouteNode | null;
  g: number; // Cost from start to current node
  h: number; // Heuristic (estimated cost from current to goal)
  f: number; // Total cost (g + h)
  station?: ChargingStation & { distanceFromPath: number };
  distanceFromPath?: number;
  roadDistance?: number; // Actual road distance between this node and its parent
  roadDuration?: number; // Estimated driving time between this node and its parent
}

export interface AStarResult {
  endNode: RouteNode;
  visitedNodes: RouteNode[];
}

export interface OptimizedRoute {
  path: LatLng[];
  roadPath?: LatLng[]; // Detailed path following roads
  stations: ChargingStation[];
  totalDistance: number;
  estimatedDuration: number;
  type: 'shortest' | 'optimal';
}
