import { ChargingStation, LatLng, calculateDistance, CityBounds } from '@/lib/mapUtils';
import { calculateDistanceFromLine, isWithinCityBounds } from './geoUtils';
import { RouteNode } from './types';

/**
 * Find stations that are close to the direct path with optimized performance
 */
export function findStationsNearPath(
  start: LatLng,
  end: LatLng,
  stations: ChargingStation[],
  maxDistance: number,
  cityBounds?: CityBounds // Optional city bounds for intra-city optimization
): (ChargingStation & { distanceFromPath: number })[] {
  // For intra-city routes, use a smaller search radius
  const directDistance = calculateDistance(start, end);
  const isIntraCityRoute = cityBounds && 
    isWithinCityBounds(start, cityBounds) && 
    isWithinCityBounds(end, cityBounds);
  
  // Use smaller radius for intra-city routes
  const actualMaxDistance = isIntraCityRoute ? 
    Math.min(maxDistance, Math.max(1, directDistance * 0.3)) : // 30% of route distance for intra-city
    maxDistance;
  
  // Create a more efficient bounding box for searching
  const padding = actualMaxDistance * 0.015;
  const minLat = Math.min(start.lat, end.lat) - padding;
  const maxLat = Math.max(start.lat, end.lat) + padding;
  const minLng = Math.min(start.lng, end.lng) - padding;
  const maxLng = Math.max(start.lng, end.lng) + padding;
  
  // Fast bounding box filtering
  const boundingBoxFiltered = stations.filter(station => {
    const coords = station.coordinates;
    
    // For intra-city routes, also check if station is within city bounds
    if (isIntraCityRoute && cityBounds && !isWithinCityBounds(coords, cityBounds)) {
      return false;
    }
    
    return coords.lat >= minLat && coords.lat <= maxLat && 
           coords.lng >= minLng && coords.lng <= maxLng;
  });
  
  // Now do the more expensive exact distance calculation
  const nearbyStations: (ChargingStation & { distanceFromPath: number })[] = [];
  
  for (const station of boundingBoxFiltered) {
    const distanceFromPath = calculateDistanceFromLine(
      station.coordinates,
      start,
      end
    );
    
    if (distanceFromPath <= actualMaxDistance) {
      nearbyStations.push({
        ...station,
        distanceFromPath
      });
    }
  }
  
  // For intra-city routes, we want fewer stations
  const limit = isIntraCityRoute ? 50 : 200;
  
  return nearbyStations
    .sort((a, b) => a.distanceFromPath - b.distanceFromPath)
    .slice(0, limit);
}

/**
 * Find stations closest to either start or end
 */
export function findClosestStations(
  start: LatLng,
  end: LatLng,
  stations: ChargingStation[],
  limit: number,
  maxDistance: number
): (ChargingStation & { distanceFromPath: number })[] {
  // For very short routes, use an even smaller radius
  const directDistance = calculateDistance(start, end);
  const actualMaxDistance = directDistance < 5 ? 
    Math.min(maxDistance, 30) : maxDistance;
  
  // Use more efficient filtering approach for better performance
  // For each station, compute distance to start and end only once
  const stationsWithDistance = stations.map(station => {
    const distToStart = calculateDistance(station.coordinates, start);
    const distToEnd = calculateDistance(station.coordinates, end);
    return {
      station,
      distToStart,
      distToEnd,
      minDist: Math.min(distToStart, distToEnd)
    };
  });
  
  // Filter and sort in a single pass
  const result: (ChargingStation & { distanceFromPath: number })[] = 
    stationsWithDistance
      .filter(item => item.minDist <= actualMaxDistance)
      .sort((a, b) => a.minDist - b.minDist)
      .slice(0, limit)
      .map(item => ({
        ...item.station,
        distanceFromPath: item.minDist
      }));
  
  return result;
}

/**
 * Count how many stations are in the path
 */
export function countStationsInPath(node: RouteNode): number {
  let count = 0;
  let current: RouteNode | null = node;
  
  while (current) {
    if (current.station) count++;
    current = current.parent;
  }
  
  return count;
}
