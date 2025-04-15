import { ChargingStation, LatLng, RouteLocation, calculateDistance, CityBounds } from '@/lib/mapUtils';
import { ChargingStationFetcher } from './ChargingStationFetcher';
import { RouteNode, OptimizedRoute } from './routeOptimizer/types';
import { findStationsNearPath, findClosestStations } from './routeOptimizer/stationSelector';
import { aStarSearch, reconstructPath } from './routeOptimizer/aStarAlgorithm';
import { isWithinCityBounds } from './routeOptimizer/geoUtils';

// Re-export types
export type { RouteNode, OptimizedRoute } from './routeOptimizer/types';

// Cache for road distances
type DistanceKey = string;
type DistanceCacheEntry = {
  distance: number;
  duration: number;
  roadPath?: LatLng[];
  timestamp: number;
};

export class RouteOptimizer {
  private static distanceCache: Map<DistanceKey, DistanceCacheEntry> = new Map<DistanceKey, DistanceCacheEntry>();
  private static CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  
  // Generate a key for the distance cache
  private static getDistanceCacheKey(start: LatLng, end: LatLng): DistanceKey {
    return `${start.lat.toFixed(5)},${start.lng.toFixed(5)}_${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
  }
  
  static async findOptimalRoute(
    start: RouteLocation,
    end: RouteLocation,
    maxDetour: number = 30,
    maxStations: number = 5,
    useOptimalPath: boolean = false,
    cityBounds?: CityBounds // Added city bounds parameter
  ): Promise<OptimizedRoute> {
    console.log(`Finding ${useOptimalPath ? 'optimal' : 'shortest'} route from ${start.name} to ${end.name}`);
    
    // Check if this is an intra-city route
    const isIntraCityRoute = cityBounds && 
      isWithinCityBounds(start.coordinates, cityBounds) && 
      isWithinCityBounds(end.coordinates, cityBounds);
    
    // For intra-city routes, use smaller thresholds
    if (isIntraCityRoute) {
      maxDetour = Math.min(maxDetour, 5); // Limit detour to 5km for intra-city
      maxStations = Math.min(maxStations, 2); // Limit to 2 stations for intra-city
    }
    
    // Check if start and end are very close
    const directDistance = calculateDistance(start.coordinates, end.coordinates);
    if (directDistance < 1) {
      // For very short distances, just return direct path
      return {
        path: [start.coordinates, end.coordinates],
        roadPath: [start.coordinates, end.coordinates],
        stations: [],
        totalDistance: directDistance,
        estimatedDuration: directDistance * 1.5, // Simple estimation
        type: 'shortest'
      };
    }
    
    // Get the road-based distance between start and end
    const directRoadDistanceData = await this.getRoadDistance(start.coordinates, end.coordinates);
    console.log(`Direct road distance: ${directRoadDistanceData.distance.toFixed(1)}km`);
    
    if (!useOptimalPath || directRoadDistanceData.distance < 5) { // Reduced threshold for intra-city
      // Return shortest path (direct path) using road routing
      return {
        path: [start.coordinates, end.coordinates],
        roadPath: directRoadDistanceData.roadPath || [start.coordinates, end.coordinates],
        stations: [],
        totalDistance: directRoadDistanceData.distance,
        estimatedDuration: Math.round(directRoadDistanceData.duration * 10) / 10, // Simple estimation with 1 decimal precision
        type: 'shortest'
      };
    }
    
    // Fetch all charging stations
    const allStations = await ChargingStationFetcher.fetchAllStations();
    console.log(`Loaded ${allStations.length} stations for route optimization`);
    
    // Use city-aware station finding
    const nearbyStations = findStationsNearPath(
      start.coordinates,
      end.coordinates,
      allStations,
      maxDetour,
      cityBounds // Pass city bounds for optimization
    );
    
    console.log(`Found ${nearbyStations.length} stations near the path`);
    
    // If no nearby stations, return the direct route
    if (nearbyStations.length === 0) {
      // As a fallback, get the closest stations to either the start or end point
      const closestToStartOrEnd = findClosestStations(
        start.coordinates, 
        end.coordinates,
        allStations,
        8,
        80
      );
      
      console.log(`Fallback: found ${closestToStartOrEnd.length} stations near start/end points`);
      
      if (closestToStartOrEnd.length === 0) {
        // If still no stations, return direct route with road path
        return {
          path: [start.coordinates, end.coordinates],
          roadPath: directRoadDistanceData.roadPath || [start.coordinates, end.coordinates],
          stations: [],
          totalDistance: directRoadDistanceData.distance,
          estimatedDuration: Math.round(directRoadDistanceData.duration * 10) / 10,
          type: 'shortest'
        };
      }
      
      // Use closest stations for path finding
      const result = await this.runAStarWithRoadDistances(
        start.coordinates,
        end.coordinates,
        closestToStartOrEnd,
        maxDetour * 2, // Allow more detour for fallback
        Math.max(3, Math.min(maxStations, 2)) // Ensure we try to include at least the minimum needed stations
      );
      
      return result;
    }
    
    // Limit the number of stations to consider for faster computation
    // Sort by distance from path and take only the closest ones
    const limitedStations = nearbyStations
      .sort((a, b) => a.distanceFromPath - b.distanceFromPath)
      .slice(0, Math.min(50, nearbyStations.length)); // Consider at most 50 closest stations
    
    console.log(`Limited to ${limitedStations.length} closest stations for faster calculation`);
    
    // Run A* algorithm to find optimal path with charging stations
    const result = await this.runAStarWithRoadDistances(
      start.coordinates,
      end.coordinates,
      limitedStations,
      maxDetour,
      Math.max(3, Math.min(maxStations, 2)) // Ensure we try to include at least the minimum needed stations
    );
    
    return result;
  }
  
  // Run A* algorithm using road distances
  private static async runAStarWithRoadDistances(
    start: LatLng,
    end: LatLng,
    stations: (ChargingStation & { distanceFromPath: number })[],
    maxDetour: number,
    maxStations: number
  ): Promise<OptimizedRoute> {
    // Convert result to optimized route
    const result = await aStarSearch(
      start,
      end,
      stations,
      maxDetour,
      maxStations,
      this.getRoadDistance // Pass the road distance function
    );
    
    return this.buildOptimizedRoute(result.endNode, 'optimal');
  }
  
  // Build the optimized route from search results
  private static async buildOptimizedRoute(endNode: RouteNode, type: 'shortest' | 'optimal'): Promise<OptimizedRoute> {
    // Convert result to optimized route
    const optimizedPath = reconstructPath(endNode);
    const selectedStations = optimizedPath
      .filter(node => node.station)
      .map(node => node.station) as ChargingStation[];
    
    const pathPoints = optimizedPath.map(node => node.location);
    
    // Calculate total distance and get detailed road path for the optimized path
    let totalDistance = 0;
    let totalDuration = 0;
    const roadPathSegments: LatLng[] = [];
    
    // Get road paths between each pair of consecutive points
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const roadData = await this.getRoadDistance(pathPoints[i], pathPoints[i + 1]);
      totalDistance += roadData.distance;
      totalDuration += roadData.duration;
      
      // Add road path for this segment (excluding the first point to avoid duplicates except for the first segment)
      if (i === 0 && roadData.roadPath) {
        roadPathSegments.push(...roadData.roadPath);
      } else if (roadData.roadPath && roadData.roadPath.length > 1) {
        // Skip the first point to avoid duplicates
        roadPathSegments.push(...roadData.roadPath.slice(1));
      }
    }
    
    // Round total distance and duration to 1 decimal place
    totalDistance = Math.round(totalDistance * 10) / 10;
    totalDuration = Math.round(totalDuration * 10) / 10;
    
    return {
      path: pathPoints,
      roadPath: roadPathSegments,
      stations: selectedStations,
      totalDistance,
      estimatedDuration: totalDuration,
      type
    };
  }
  
  // Get road-based distance using OpenStreetMap Routing API with caching
  static async getRoadDistance(start: LatLng, end: LatLng): Promise<{ 
    distance: number, 
    duration: number,
    roadPath?: LatLng[]
  }> {
    // Generate cache key
    const cacheKey = this.getDistanceCacheKey(start, end);
    const reverseCacheKey = this.getDistanceCacheKey(end, start);
    
    // Check if distance is in cache and not expired
    const cachedEntry = this.distanceCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedEntry && (now - cachedEntry.timestamp) < this.CACHE_EXPIRY_MS) {
      return {
        distance: cachedEntry.distance,
        duration: cachedEntry.duration,
        roadPath: cachedEntry.roadPath
      };
    }
    
    // Check reverse direction in cache (road distance should be similar in both directions)
    const reverseCachedEntry = this.distanceCache.get(reverseCacheKey);
    if (reverseCachedEntry && (now - reverseCachedEntry.timestamp) < this.CACHE_EXPIRY_MS) {
      // Return the reverse entry but reverse the road path
      return {
        distance: reverseCachedEntry.distance,
        duration: reverseCachedEntry.duration,
        roadPath: reverseCachedEntry.roadPath ? [...reverseCachedEntry.roadPath].reverse() : undefined
      };
    }
    
    try {
      // If straight-line distance is very small, skip API call
      const straightLineDistance = calculateDistance(start, end);
      if (straightLineDistance < 0.2) { // Less than 200m
        const result = {
          distance: straightLineDistance,
          duration: straightLineDistance * 1.5,
          roadPath: [start, end]
        };
        
        // Cache the result
        this.distanceCache.set(cacheKey, {
          ...result,
          timestamp: now
        });
        
        return result;
      }
      
      // Format coordinates for OSRM API (lng,lat format)
      const startCoord = `${start.lng},${start.lat}`;
      const endCoord = `${end.lng},${end.lat}`;
      
      // Fetch route from OSRM API
      const response = await fetch(`${OSM_ROUTING_URL}/${startCoord};${endCoord}?overview=full&geometries=geojson`);
      const data = await response.json();
      
      if (!response.ok || !data.routes || data.routes.length === 0) {
        console.error('Failed to get road distance, falling back to straight-line', data);
        // Fallback to straight-line distance
        const straightLineDistance = calculateDistance(start, end);
        const result = { 
          distance: straightLineDistance, 
          duration: straightLineDistance * 1.5 // Simple duration estimate
        };
        
        // Cache the result
        this.distanceCache.set(cacheKey, {
          ...result,
          timestamp: now
        });
        
        return result;
      }
      
      // Extract route information
      const route = data.routes[0];
      const distanceInKm = route.distance / 1000; // Convert meters to km
      const durationInMinutes = route.duration / 60; // Convert seconds to minutes
      
      // Extract road path coordinates
      const roadPath: LatLng[] = route.geometry.coordinates.map((coord: number[]) => ({
        lng: coord[0],
        lat: coord[1]
      }));
      
      const result = {
        distance: Math.round(distanceInKm * 10) / 10, // Round to 1 decimal
        duration: Math.round(durationInMinutes * 10) / 10, // Round to 1 decimal
        roadPath
      };
      
      // Cache the result
      this.distanceCache.set(cacheKey, {
        ...result,
        timestamp: now
      });
      
      return result;
    } catch (error) {
      console.error('Error getting road distance:', error);
      // Fallback to straight-line distance
      const straightLineDistance = calculateDistance(start, end);
      return { 
        distance: straightLineDistance, 
        duration: straightLineDistance * 1.5 // Simple duration estimate
      };
    }
  }
}
