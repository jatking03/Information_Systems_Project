export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteLocation {
  id: string;
  name: string;
  address: string;
  coordinates: LatLng;
}

export interface RouteInfo {
  distance: number; // in kilometers
  duration: number; // in minutes
  startLocation: RouteLocation;
  endLocation: RouteLocation;
  waypoints?: RouteLocation[];
  transportMode: 'driving' | 'walking' | 'transit';
  chargingStations?: ChargingStation[];
  roadPath?: LatLng[]; // Added this property for detailed road path
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  coordinates: LatLng;
  availablePoints: number;
  totalPoints: number;
  powerKw: number;
  pricePerKwh: number;
  provider: string;
  amenities: string[];
  rating?: number;
}

export const sampleLocations: RouteLocation[] = [
  {
    id: '1',
    name: 'Mumbai',
    address: 'Mumbai, Maharashtra, India',
    coordinates: { lat: 19.0760, lng: 72.8777 }
  },
  {
    id: '2',
    name: 'Pune',
    address: 'Pune, Maharashtra, India',
    coordinates: { lat: 18.5204, lng: 73.8567 }
  },
  {
    id: '3',
    name: 'Bangalore',
    address: 'Bangalore, Karnataka, India',
    coordinates: { lat: 12.9716, lng: 77.5946 }
  },
  {
    id: '4',
    name: 'Delhi',
    address: 'New Delhi, Delhi, India',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  },
  {
    id: '5',
    name: 'Chennai',
    address: 'Chennai, Tamil Nadu, India',
    coordinates: { lat: 13.0827, lng: 80.2707 }
  }
];

export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

export const calculateDuration = (distance: number, transportMode: 'driving' | 'walking' | 'transit'): number => {
  const avgSpeeds = {
    driving: 60,
    walking: 5,
    transit: 30
  };
  
  const durationHours = distance / avgSpeeds[transportMode];
  const durationMinutes = durationHours * 60;
  
  return Math.round(durationMinutes);
};

export const getRoute = (
  start: RouteLocation, 
  end: RouteLocation, 
  transportMode: 'driving' | 'walking' | 'transit' = 'driving'
): RouteInfo => {
  const distance = calculateDistance(start.coordinates, end.coordinates);
  const duration = calculateDuration(distance, transportMode);
  
  return {
    distance,
    duration,
    startLocation: start,
    endLocation: end,
    transportMode
  };
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60 * 10) / 10; // Round to 1 decimal place
  
  if (hours === 0) {
    return `${mins.toFixed(1)} min`;
  } else if (mins === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${mins.toFixed(1)} min`;
  }
};

export const formatDistance = (distance: number): string => {
  return `${distance.toFixed(1)} km`; // Also showing 1 decimal place for consistency
};

export const findNearbyChargingStations = (location: LatLng, radiusKm: number = 50): Promise<ChargingStation[]> => {
  return import('@/services/ChargingStationFetcher').then(module => {
    const ChargingStationFetcher = module.ChargingStationFetcher;
    return ChargingStationFetcher.fetchAllStations()
      .then(stations => {
        return stations.filter(station => {
          const distance = calculateDistance(location, station.coordinates);
          return distance <= radiusKm;
        }).sort((a, b) => {
          const distanceA = calculateDistance(location, a.coordinates);
          const distanceB = calculateDistance(location, b.coordinates);
          return distanceA - distanceB;
        });
      });
  });
};

export interface CityBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const indianCities = [
  {
    name: 'Mumbai',
    bounds: {
      north: 19.2771,
      south: 18.8928,
      east: 73.0169,
      west: 72.7756
    }
  },
  {
    name: 'Delhi',
    bounds: {
      north: 28.8836,
      south: 28.4041,
      east: 77.3463,
      west: 76.8386
    }
  },
  {
    name: 'Bangalore',
    bounds: {
      north: 13.1368,
      south: 12.8342,
      east: 77.7480,
      west: 77.4601
    }
  },
  {
    name: 'Chennai',
    bounds: {
      north: 13.2366,
      south: 12.9419,
      east: 80.3181,
      west: 80.1843
    }
  },
  {
    name: 'Kolkata',
    bounds: {
      north: 22.6293,
      south: 22.4716,
      east: 88.4421,
      west: 88.2176
    }
  }
] as const;

export const geocodeLocation = async (searchText: string, cityBounds?: CityBounds): Promise<RouteLocation | null> => {
  try {
    const viewbox = cityBounds 
      ? `&viewbox=${cityBounds.west},${cityBounds.south},${cityBounds.east},${cityBounds.north}&bounded=1` 
      : '';
      
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&countrycodes=in${viewbox}&limit=1`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        id: `loc-${result.place_id}`,
        name: result.display_name.split(',')[0],
        address: result.display_name,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
