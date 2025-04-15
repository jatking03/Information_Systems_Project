
import { LatLng, calculateDistance, ChargingStation } from '@/lib/mapUtils';
import { RouteNode, AStarResult } from './types';
import { countStationsInPath } from './stationSelector';

type GetRoadDistanceFunction = (start: LatLng, end: LatLng) => Promise<{
  distance: number;
  duration: number;
  roadPath?: LatLng[];
}>;

/**
 * A* algorithm implementation with road distances
 */
export async function aStarSearch(
  start: LatLng,
  goal: LatLng,
  stations: (ChargingStation & { distanceFromPath: number })[],
  maxDetour: number,
  maxStations: number,
  getRoadDistance?: GetRoadDistanceFunction
): Promise<AStarResult> {
  const openSet: RouteNode[] = [];
  const closedSet: RouteNode[] = [];
  const visitedStations: Set<string> = new Set();
  
  // Use straight-line distance initially for the heuristic
  const directDistance = calculateDistance(start, goal);
  
  // Get road distance if function is provided
  let directRoadDistance = directDistance;
  if (getRoadDistance) {
    try {
      const roadData = await getRoadDistance(start, goal);
      directRoadDistance = roadData.distance;
    } catch (error) {
      console.error('Failed to get road distance for heuristic:', error);
    }
  }
  
  // Create start node
  const startNode: RouteNode = {
    location: start,
    parent: null,
    g: 0,
    h: directRoadDistance,
    f: directRoadDistance,
  };
  
  openSet.push(startNode);
  
  // Target number of segments based on distance
  const targetSegments = Math.min(
    Math.max(2, Math.ceil(directRoadDistance / 120)),
    maxStations + 1
  );
  
  // Enhanced station distribution heuristic
  const idealSegmentLength = directRoadDistance / targetSegments;
  
  // Optimization: Set a limit to avoid infinite loops
  let iterationCount = 0;
  const MAX_ITERATIONS = 200;
  
  // For short routes, we don't need to explore as many nodes
  const explorationFactor = directRoadDistance < 20 ? 0.5 : 1.0;
  
  while (openSet.length > 0 && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    
    // Add to closed set
    closedSet.push(current);
    
    // If we reached the goal
    if (calculateDistance(current.location, goal) < 0.5) { // Within 500m
      return { endNode: current, visitedNodes: closedSet };
    }
    
    // Count stations visited so far
    const stationsVisited = countStationsInPath(current);
    
    // Calculate progress along the route (0 to 1)
    let currentProgress = 0;
    let distanceFromStart = 0;
    let currentNode: RouteNode | null = current;
    
    while (currentNode && currentNode.parent) {
      distanceFromStart += currentNode.roadDistance || calculateDistance(currentNode.location, currentNode.parent.location);
      currentNode = currentNode.parent;
    }
    
    currentProgress = distanceFromStart / (distanceFromStart + directRoadDistance);
    
    // If we've already included max stations and this isn't the goal,
    // only consider the goal as the next node
    if (stationsVisited >= maxStations) {
      // Get road distance to goal if available
      let roadToGoalDistance = calculateDistance(current.location, goal);
      let roadToGoalDuration = roadToGoalDistance * 1.5;
      
      if (getRoadDistance) {
        try {
          const roadData = await getRoadDistance(current.location, goal);
          roadToGoalDistance = roadData.distance;
          roadToGoalDuration = roadData.duration;
        } catch (error) {
          console.error('Failed to get road distance to goal:', error);
        }
      }
      
      const goalNode: RouteNode = {
        location: goal,
        parent: current,
        g: current.g + roadToGoalDistance,
        h: 0,
        f: current.g + roadToGoalDistance,
        roadDistance: roadToGoalDistance,
        roadDuration: roadToGoalDuration
      };
      
      return { endNode: goalNode, visitedNodes: [...closedSet, goalNode] };
    }
    
    // Generate neighbors (charging stations + goal)
    const neighbors: RouteNode[] = [];
    
    // Always consider the goal as a neighbor
    // But with enhanced heuristic based on stations visited vs. target
    let directToGoalDistance = calculateDistance(current.location, goal);
    let directToGoalDuration = directToGoalDistance * 1.5;
    
    if (getRoadDistance) {
      try {
        const roadData = await getRoadDistance(current.location, goal);
        directToGoalDistance = roadData.distance;
        directToGoalDuration = roadData.duration;
      } catch (error) {
        console.error('Failed to get road distance for direct path to goal:', error);
      }
    }
    
    const directToGoalCost = current.g + directToGoalDistance;
    let goalPriorityFactor = 1.0;
    
    // For short routes, prioritize direct path more
    const isShortRoute = directRoadDistance < 20;
    
    // If we haven't visited enough stations yet, penalize going directly to goal
    // But for short routes, don't penalize as much
    if (!isShortRoute && stationsVisited < Math.ceil(targetSegments) - 1 && 
        directRoadDistance > 200 && // Only for long routes
        currentProgress < 0.7) { // Don't penalize when we're close to the goal
      goalPriorityFactor = 1.5; // Higher score (worse) for direct path
    }
    
    neighbors.push({
      location: goal,
      parent: current,
      g: current.g + directToGoalDistance,
      h: 0,
      f: (current.g + directToGoalDistance) * goalPriorityFactor,
      roadDistance: directToGoalDistance,
      roadDuration: directToGoalDuration
    });
    
    // For optimization, limit the number of stations we consider based on route length
    // Shorter routes need fewer station evaluations
    const stationLimit = isShortRoute ? 
      Math.min(5, stations.length) : 
      Math.min(15, stations.length);
      
    // Consider stations as neighbors
    // We'll prioritize stations that are close to the path and haven't been visited
    const potentialStations = stations
      .filter(station => !visitedStations.has(station.id))
      .sort((a, b) => a.distanceFromPath - b.distanceFromPath)
      .slice(0, stationLimit);
    
    for (const station of potentialStations) {
      // Calculate road distance to this station
      let stationDistance = calculateDistance(current.location, station.coordinates);
      let stationDuration = stationDistance * 1.5;
      let stationToGoalDistance = calculateDistance(station.coordinates, goal);
      let stationToGoalDuration = stationToGoalDistance * 1.5;
      
      if (getRoadDistance) {
        try {
          const stationRoadData = await getRoadDistance(current.location, station.coordinates);
          stationDistance = stationRoadData.distance;
          stationDuration = stationRoadData.duration;
          
          const toGoalRoadData = await getRoadDistance(station.coordinates, goal);
          stationToGoalDistance = toGoalRoadData.distance;
          stationToGoalDuration = toGoalRoadData.duration;
        } catch (error) {
          console.error('Failed to get road distance for station path:', error);
        }
      }
      
      // Calculate additional distance if we detour to this station using road distances
      const detourDistance = 
        stationDistance + 
        stationToGoalDistance - 
        directToGoalDistance;
      
      // Skip if detour is too long
      if (detourDistance > maxDetour) continue;
      
      // Create node for this station
      const stationNode: RouteNode = {
        location: station.coordinates,
        parent: current,
        g: current.g + stationDistance,
        h: stationToGoalDistance,
        f: 0,
        station: station,
        distanceFromPath: station.distanceFromPath,
        roadDistance: stationDistance,
        roadDuration: stationDuration
      };
      
      // Calculate how far along the path we are
      const segmentProgress = stationsVisited / targetSegments;
      
      // Calculate how ideal this station's position is for even distribution
      // 1.0 = perfect, higher = less ideal
      const currentDistFromStart = distanceFromStart + stationDistance;
      const idealPositionForThisSegment = (stationsVisited + 1) * idealSegmentLength;
      const positionScore = Math.abs(currentDistFromStart - idealPositionForThisSegment) / idealSegmentLength;
      
      // Calculate f score with an improved heuristic that:
      // 1. Prioritizes stations close to the direct path
      // 2. Favors stations with more available charging points
      // 3. Prefers stations with lower prices
      // 4. Considers station ratings
      // 5. Favors stations that create even distribution
      const pathProximityFactor = 1 - (station.distanceFromPath / maxDetour);
      const availabilityFactor = station.availablePoints / Math.max(1, station.totalPoints);
      const priceFactor = 1 - (station.pricePerKwh / 30); // Assuming max price is 30
      const ratingFactor = station.rating ? station.rating / 5 : 0.5; // Assuming rating is out of 5
      const distributionFactor = 1 / (1 + positionScore); // Higher is better (closer to ideal position)
      
      // For short routes, path proximity and price are more important than distribution
      const heuristicBonus = isShortRoute ? 
        (pathProximityFactor * 6) + (priceFactor * 4) + (availabilityFactor * 2) :
        (pathProximityFactor * 4) + (availabilityFactor * 3) + (priceFactor * 2) + 
        (ratingFactor * 1) + (distributionFactor * 5);
      
      // Final f score (lower is better)
      stationNode.f = stationNode.g + stationNode.h - (heuristicBonus * (isShortRoute ? 4 : 7));
      
      neighbors.push(stationNode);
    }
    
    // Process neighbors
    for (const neighbor of neighbors) {
      // Skip if this neighbor is in the closed set
      if (closedSet.some(node => 
        calculateDistance(node.location, neighbor.location) < 0.1 &&
        (!neighbor.station || !node.station || neighbor.station.id === node.station.id)
      )) {
        continue;
      }
      
      // Check if this is a better path to this neighbor
      const existingInOpen = openSet.find(node => 
        calculateDistance(node.location, neighbor.location) < 0.1 &&
        (!neighbor.station || !node.station || neighbor.station.id === node.station.id)
      );
      
      if (!existingInOpen || neighbor.g < existingInOpen.g) {
        // If this is a station, mark it as visited
        if (neighbor.station) {
          visitedStations.add(neighbor.station.id);
        }
        
        // Add to open set
        if (!existingInOpen) {
          openSet.push(neighbor);
        } else {
          // Update existing
          existingInOpen.g = neighbor.g;
          existingInOpen.f = neighbor.f;
          existingInOpen.parent = neighbor.parent;
          existingInOpen.roadDistance = neighbor.roadDistance;
          existingInOpen.roadDuration = neighbor.roadDuration;
        }
      }
    }
  }
  
  // If we reached max iterations or no path was found, create a direct path
  console.log(`A* search ended after ${iterationCount} iterations. ${openSet.length} nodes left in open set.`);
  
  // Create a direct path to the goal
  let directGoalDistance = calculateDistance(start, goal);
  let directGoalDuration = directGoalDistance * 1.5;
  
  if (getRoadDistance) {
    try {
      const roadData = await getRoadDistance(start, goal);
      directGoalDistance = roadData.distance;
      directGoalDuration = roadData.duration;
    } catch (error) {
      console.error('Failed to get road distance for fallback path:', error);
    }
  }
  
  const directNode: RouteNode = {
    location: goal,
    parent: startNode,
    g: directGoalDistance,
    h: 0,
    f: directGoalDistance,
    roadDistance: directGoalDistance,
    roadDuration: directGoalDuration
  };
  
  return { endNode: directNode, visitedNodes: [startNode, directNode] };
}

/**
 * Reconstruct path from end node
 */
export function reconstructPath(endNode: RouteNode): RouteNode[] {
  const path: RouteNode[] = [];
  let current: RouteNode | null = endNode;
  
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  
  return path;
}
