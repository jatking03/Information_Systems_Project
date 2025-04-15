
import { LatLng } from '@/lib/mapUtils';
import { calculateDistance } from '@/lib/mapUtils';
import { CityBounds } from '@/lib/mapUtils';

/**
 * Calculate the distance from a point to a line segment (start-end)
 * Optimized for better performance
 */
export function calculateDistanceFromLine(point: LatLng, start: LatLng, end: LatLng): number {
  // Fast path: If line is very short, just return the minimum distance to either endpoint
  if (start.lat === end.lat && start.lng === end.lng) {
    return calculateDistance(start, point);
  }
  
  // Fast approximation for points clearly not near the line
  // Check if point is roughly within the "rectangle" formed by start and end points
  const buffer = 0.01; // Roughly 1.1km at the equator
  const isWithinLatRange = 
    point.lat >= Math.min(start.lat, end.lat) - buffer && 
    point.lat <= Math.max(start.lat, end.lat) + buffer;
  const isWithinLngRange = 
    point.lng >= Math.min(start.lng, end.lng) - buffer && 
    point.lng <= Math.max(start.lng, end.lng) + buffer;
  
  // If point is clearly outside the general area of the line segment,
  // just return the minimum distance to either endpoint to avoid more expensive calculations
  if (!isWithinLatRange && !isWithinLngRange) {
    return Math.min(
      calculateDistance(start, point),
      calculateDistance(end, point)
    );
  }
  
  const a = calculateDistance(start, point);
  const b = calculateDistance(end, point);
  const c = calculateDistance(start, end);
  
  // If the line is very short, just return the minimum distance to either endpoint
  if (c < 0.1) return Math.min(a, b);
  
  // Use Heron's formula to calculate the area of the triangle
  const s = (a + b + c) / 2;
  const areaSquared = s * (s - a) * (s - b) * (s - c);
  
  // Prevent negative values due to floating point errors
  const area = Math.sqrt(Math.max(0, areaSquared));
  
  // The height of the triangle is 2 * area / base
  return (2 * area) / c;
}

/**
 * Check if a point is within city bounds with a small buffer
 */
export function isWithinCityBounds(point: LatLng, bounds: CityBounds, bufferKm: number = 0.5): boolean {
  // Convert buffer to approximate degrees (rough estimation)
  const buffer = bufferKm / 111; // 1 degree ≈ 111km at the equator
  
  return point.lat >= bounds.south - buffer &&
         point.lat <= bounds.north + buffer &&
         point.lng >= bounds.west - buffer &&
         point.lng <= bounds.east + buffer;
}

/**
 * Calculate the center point of a city
 */
export function calculateCityCenter(bounds: CityBounds): LatLng {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
}

